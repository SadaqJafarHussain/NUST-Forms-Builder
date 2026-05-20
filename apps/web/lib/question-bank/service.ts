import "server-only";
import { cache } from "react";
import { prisma } from "@formbricks/database";
import { DatabaseError } from "@formbricks/types/errors";
import { TSurveyQuestion } from "@formbricks/types/surveys/types";

// ── Surveys with questions (for import dialog + suggestion engine) ────────────

export const getSurveysWithQuestionsForOrg = cache(
  async (
    organizationId: string
  ): Promise<Array<{ id: string; name: string; questions: TSurveyQuestion[] }>> => {
    try {
      const environments = await prisma.environment.findMany({
        where: { project: { organizationId } },
        select: { id: true },
      });
      const environmentIds = environments.map((e) => e.id);

      const surveys = await prisma.survey.findMany({
        where: { environmentId: { in: environmentIds } },
        select: { id: true, name: true, questions: true },
        orderBy: { updatedAt: "desc" },
      });

      return surveys.map((s) => ({
        id: s.id,
        name: s.name,
        questions: (s.questions as unknown as TSurveyQuestion[]) ?? [],
      }));
    } catch {
      throw new DatabaseError("Failed to get surveys with questions");
    }
  }
);

// Get all questions for an organization (org-wide, not per environment)
export const getQuestionBankItems = cache(
  async (
    organizationId: string
  ): Promise<
    Array<{
      id: string;
      questionData: TSurveyQuestion;
      type: string;
      category: string | null;
      usageCount: number;
      createdAt: Date;
    }>
  > => {
    try {
      const items = await prisma.questionBankItem.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
      });

      return items.map((item) => ({
        id: item.id,
        questionData: item.questionData as TSurveyQuestion,
        type: item.type,
        category: item.category,
        usageCount: item.usageCount,
        createdAt: item.createdAt,
      }));
    } catch (error) {
      throw new DatabaseError("Failed to get question bank items");
    }
  }
);

// Create a new question in the bank
export const createQuestionBankItem = async (
  organizationId: string,
  questionData: TSurveyQuestion,
  category?: string,
  createdBy?: string
): Promise<string> => {
  try {
    const item = await prisma.questionBankItem.create({
      data: {
        organizationId,
        questionData: questionData as any,
        type: questionData.type,
        category,
        createdBy,
      },
    });

    return item.id;
  } catch (error) {
    throw new DatabaseError("Failed to create question bank item");
  }
};

// Create multiple questions at once (for Excel upload)
export const createQuestionBankItems = async (
  organizationId: string,
  questions: TSurveyQuestion[],
  category?: string,
  createdBy?: string
): Promise<number> => {
  try {
    const result = await prisma.questionBankItem.createMany({
      data: questions.map((q) => ({
        organizationId,
        questionData: q as any,
        type: q.type,
        category,
        createdBy,
      })),
    });

    return result.count;
  } catch (error) {
    throw new DatabaseError("Failed to create question bank items");
  }
};

// Increment usage count when a question is used
export const incrementQuestionUsage = async (questionId: string): Promise<void> => {
  try {
    await prisma.questionBankItem.update({
      where: { id: questionId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    throw new DatabaseError("Failed to increment question usage");
  }
};

// Delete a question from the bank
export const deleteQuestionBankItem = async (questionId: string): Promise<void> => {
  try {
    await prisma.questionBankItem.delete({
      where: { id: questionId },
    });
  } catch (error) {
    throw new DatabaseError("Failed to delete question bank item");
  }
};

// Filter questions by type
export const getQuestionBankItemsByType = cache(async (organizationId: string, type: string) => {
  try {
    const items = await prisma.questionBankItem.findMany({
      where: { organizationId, type },
      orderBy: { usageCount: "desc" },
    });

    return items.map((item) => ({
      id: item.id,
      questionData: item.questionData as TSurveyQuestion,
      type: item.type,
      category: item.category,
      usageCount: item.usageCount,
      createdAt: item.createdAt,
    }));
  } catch (error) {
    throw new DatabaseError("Failed to get question bank items by type");
  }
});
