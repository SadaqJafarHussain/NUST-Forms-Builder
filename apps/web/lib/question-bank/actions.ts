"use server";

import { z } from "zod";
import { ZSurveyQuestion } from "@formbricks/types/surveys/types";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { getOrganizationIdFromEnvironmentId } from "@/lib/utils/helper";
import {
  createQuestionBankItem,
  createQuestionBankItems,
  deleteQuestionBankItem,
  getQuestionBankItems,
  getSurveysWithQuestionsForOrg,
} from "./service";

const ZUploadQuestionsAction = z.object({
  environmentId: z.string().cuid(),
  questions: z.array(ZSurveyQuestion),
  category: z.string().optional(),
});

export const uploadQuestionsAction = authenticatedActionClient
  .schema(ZUploadQuestionsAction)
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
      ],
    });

    const count = await createQuestionBankItems(
      organizationId,
      parsedInput.questions,
      parsedInput.category,
      ctx.user.id
    );

    return { success: true, count };
  });

const ZGetQuestionsAction = z.object({
  environmentId: z.string().cuid(),
});

export const getQuestionsAction = authenticatedActionClient
  .schema(ZGetQuestionsAction)
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [
        {
          type: "organization",
          roles: ["owner", "manager", "member"],
        },
      ],
    });

    const questions = await getQuestionBankItems(organizationId);

    return questions;
  });

// Save a single question to the question bank
const ZSaveToQuestionBankAction = z.object({
  environmentId: z.string().cuid(),
  question: ZSurveyQuestion,
  category: z.string().optional(),
});

export const saveToQuestionBankAction = authenticatedActionClient
  .schema(ZSaveToQuestionBankAction)
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [
        {
          type: "organization",
          roles: ["owner", "manager", "member"],
        },
      ],
    });

    const questionId = await createQuestionBankItem(
      organizationId,
      parsedInput.question,
      parsedInput.category,
      ctx.user.id
    );

    return { success: true, questionId };
  });

// Get all surveys with their questions (for import dialog + suggestions)
const ZGetSurveysForImportAction = z.object({
  environmentId: z.string().cuid(),
});

export const getSurveysForImportAction = authenticatedActionClient
  .schema(ZGetSurveysForImportAction)
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [
        {
          type: "organization",
          roles: ["owner", "manager", "member"],
        },
      ],
    });

    return await getSurveysWithQuestionsForOrg(organizationId);
  });

// Delete a question from the question bank
const ZDeleteFromQuestionBankAction = z.object({
  environmentId: z.string().cuid(),
  questionId: z.string().cuid(),
});

export const deleteFromQuestionBankAction = authenticatedActionClient
  .schema(ZDeleteFromQuestionBankAction)
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
      ],
    });

    await deleteQuestionBankItem(parsedInput.questionId);

    return { success: true };
  });
