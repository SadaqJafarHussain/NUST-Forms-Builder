import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";
import { prisma } from "@formbricks/database";
import { logger } from "@formbricks/logger";
import { ZId } from "@formbricks/types/common";
import { InvalidInputError } from "@formbricks/types/errors";
import { TResponseWithQuotaFull } from "@formbricks/types/quota";
import { TResponseInput, ZResponseInput } from "@formbricks/types/responses";
import { responses } from "@/app/lib/api/response";
import { transformErrorToDetails } from "@/app/lib/api/validator";
import { withV1ApiWrapper } from "@/app/lib/api/with-api-logging";
import { sendToPipeline } from "@/app/lib/pipelines";
import { capturePosthogEnvironmentEvent } from "@/lib/posthogServer";
import { getSurvey } from "@/lib/survey/service";
import { getIsContactsEnabled } from "@/modules/ee/license-check/lib/utils";
import { createQuotaFullObject } from "@/modules/ee/quotas/lib/helpers";
import { validateFileUploads } from "@/modules/storage/utils";
import { createResponseWithQuotaEvaluation } from "./lib/response";

/**
 * Atomically checks choice response limits using PostgreSQL advisory locks.
 * When two submissions race for the last slot, the advisory lock serializes them:
 * - First request acquires the lock, counts, sees count < limit, proceeds
 * - Second request blocks until first commits, then counts again, sees count >= limit, rejects
 * Returns the violated choice info, or null if all limits are satisfied.
 */
async function enforceChoiceLimits(
  surveyId: string,
  questions: any[],
  responseData: Record<string, unknown>
): Promise<{ choiceId: string; questionId: string } | null> {
  // Build list of limited choices that appear in this submission
  const checks: Array<{
    questionId: string;
    choiceId: string;
    choiceLabel: string;
    limit: number;
  }> = [];

  for (const question of questions) {
    if (question.type !== "multipleChoiceSingle" && question.type !== "multipleChoiceMulti") continue;
    const answer = responseData[question.id];
    if (answer == null) continue;
    const labels = Array.isArray(answer) ? answer.map(String) : [String(answer)];
    for (const label of labels) {
      const choice = question.choices?.find(
        (c: any) => c.limit != null && Object.values(c.label ?? {}).some((v) => v === label)
      );
      if (!choice?.limit) continue;
      checks.push({ questionId: question.id, choiceId: choice.id, choiceLabel: label, limit: choice.limit });
    }
  }

  if (!checks.length) return null;

  try {
    return await prisma.$transaction(async (tx) => {
      for (const check of checks) {
        // pg_advisory_xact_lock: exclusive lock per choice, released automatically on tx commit/rollback
        // hashtext() converts the string key to int4 which advisory lock requires
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${surveyId}:${check.choiceId}`}))`;

        // Count finished responses that selected this choice (lock is held, so no concurrent insert can sneak in)
        const allFinished = await tx.response.findMany({
          where: { surveyId, finished: true },
          select: { data: true },
        });

        let count = 0;
        for (const r of allFinished) {
          const val = (r.data as Record<string, unknown>)[check.questionId];
          if (val == null) continue;
          const vals = Array.isArray(val) ? val.map(String) : [String(val)];
          if (vals.includes(check.choiceLabel)) count++;
        }

        if (count >= check.limit) {
          return { choiceId: check.choiceId, questionId: check.questionId };
        }
      }
      return null;
    });
  } catch (err) {
    // If advisory lock check fails for any reason, allow the submission through
    logger.error({ err }, "Choice limit check failed — allowing submission");
    return null;
  }
}

interface Context {
  params: Promise<{
    environmentId: string;
  }>;
}

export const OPTIONS = async (): Promise<Response> => {
  return responses.successResponse(
    {},
    true,
    // Cache CORS preflight responses for 1 hour (conservative approach)
    // Balances performance gains with flexibility for CORS policy changes
    "public, s-maxage=3600, max-age=3600"
  );
};

export const POST = withV1ApiWrapper({
  handler: async ({ req, props }: { req: NextRequest; props: Context }) => {
    const params = await props.params;
    const requestHeaders = await headers();
    let responseInput;
    try {
      responseInput = await req.json();
    } catch (error) {
      return {
        response: responses.badRequestResponse(
          "Invalid JSON in request body",
          { error: error.message },
          true
        ),
      };
    }

    const { environmentId } = params;
    const environmentIdValidation = ZId.safeParse(environmentId);
    const responseInputValidation = ZResponseInput.safeParse({ ...responseInput, environmentId });

    if (!environmentIdValidation.success) {
      return {
        response: responses.badRequestResponse(
          "Fields are missing or incorrectly formatted",
          transformErrorToDetails(environmentIdValidation.error),
          true
        ),
      };
    }

    if (!responseInputValidation.success) {
      return {
        response: responses.badRequestResponse(
          "Fields are missing or incorrectly formatted",
          transformErrorToDetails(responseInputValidation.error),
          true
        ),
      };
    }

    const userAgent = req.headers.get("user-agent") || undefined;
    const agent = new UAParser(userAgent);

    const country =
      requestHeaders.get("CF-IPCountry") ||
      requestHeaders.get("X-Vercel-IP-Country") ||
      requestHeaders.get("CloudFront-Viewer-Country") ||
      undefined;

    const responseInputData = responseInputValidation.data;

    if (responseInputData.userId) {
      const isContactsEnabled = await getIsContactsEnabled();
      if (!isContactsEnabled) {
        return {
          response: responses.forbiddenResponse(
            "User identification is only available for enterprise users.",
            true
          ),
        };
      }
    }

    // get and check survey
    const survey = await getSurvey(responseInputData.surveyId);
    if (!survey) {
      return {
        response: responses.notFoundResponse("Survey", responseInputData.surveyId, true),
      };
    }
    if (survey.environmentId !== environmentId) {
      return {
        response: responses.badRequestResponse(
          "Survey is part of another environment",
          {
            "survey.environmentId": survey.environmentId,
            environmentId,
          },
          true
        ),
      };
    }

    if (!validateFileUploads(responseInputData.data, survey.questions)) {
      return {
        response: responses.badRequestResponse("Invalid file upload response"),
      };
    }

    // Enforce per-choice response limits (atomic — prevents race conditions)
    const choiceLimitViolation = await enforceChoiceLimits(
      responseInputData.surveyId,
      survey.questions,
      responseInputData.data as Record<string, unknown>
    );
    if (choiceLimitViolation) {
      return {
        response: responses.badRequestResponse(
          "choice_limit_exceeded",
          { choiceId: choiceLimitViolation.choiceId, questionId: choiceLimitViolation.questionId },
          true
        ),
      };
    }

    let response: TResponseWithQuotaFull;
    try {
      const meta: TResponseInput["meta"] = {
        source: responseInputData?.meta?.source,
        url: responseInputData?.meta?.url,
        userAgent: {
          browser: agent.getBrowser().name,
          device: agent.getDevice().type || "desktop",
          os: agent.getOS().name,
        },
        country: country,
        action: responseInputData?.meta?.action,
      };

      response = await createResponseWithQuotaEvaluation({
        ...responseInputData,
        meta,
      });
    } catch (error) {
      if (error instanceof InvalidInputError) {
        return {
          response: responses.badRequestResponse(error.message),
        };
      } else {
        logger.error({ error, url: req.url }, "Error creating response");
        return {
          response: responses.internalServerErrorResponse(error.message),
        };
      }
    }

    const { quotaFull, ...responseData } = response;

    sendToPipeline({
      event: "responseCreated",
      environmentId: survey.environmentId,
      surveyId: responseData.surveyId,
      response: responseData,
    });

    if (responseInput.finished) {
      sendToPipeline({
        event: "responseFinished",
        environmentId: survey.environmentId,
        surveyId: responseData.surveyId,
        response: responseData,
      });
    }

    await capturePosthogEnvironmentEvent(survey.environmentId, "response created", {
      surveyId: responseData.surveyId,
      surveyType: survey.type,
    });

    const quotaObj = createQuotaFullObject(quotaFull);

    const responseDataWithQuota = {
      id: responseData.id,
      ...quotaObj,
    };

    return {
      response: responses.successResponse(responseDataWithQuota, true),
    };
  },
});
