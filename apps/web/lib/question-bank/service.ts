import "server-only";
import { cache } from "react";
import { prisma } from "@formbricks/database";
import { DatabaseError } from "@formbricks/types/errors";
import { TSurveyQuestion } from "@formbricks/types/surveys/types";

// Get all questions for an environment
export const getQuestionBankItems = cache(
  async (
    environmentId: string
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
        where: { environmentId },
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
  environmentId: string,
  questionData: TSurveyQuestion,
  category?: string,
  createdBy?: string
): Promise<string> => {
  try {
    const item = await prisma.questionBankItem.create({
      data: {
        environmentId,
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
  environmentId: string,
  questions: TSurveyQuestion[],
  category?: string,
  createdBy?: string
): Promise<number> => {
  try {
    const result = await prisma.questionBankItem.createMany({
      data: questions.map((q) => ({
        environmentId,
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
export const getQuestionBankItemsByType = cache(async (environmentId: string, type: string) => {
  try {
    const items = await prisma.questionBankItem.findMany({
      where: { environmentId, type },
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
