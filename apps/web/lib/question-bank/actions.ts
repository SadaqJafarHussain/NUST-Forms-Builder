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
      parsedInput.environmentId,
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

    const questions = await getQuestionBankItems(parsedInput.environmentId);

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
      parsedInput.environmentId,
      parsedInput.question,
      parsedInput.category,
      ctx.user.id
    );

    return { success: true, questionId };
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
