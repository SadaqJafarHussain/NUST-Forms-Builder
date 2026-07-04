import { NextRequest } from "next/server";
import { prisma } from "@formbricks/database";
import { TSurveyQuestionTypeEnum } from "@formbricks/types/surveys/types";
import { responses } from "@/app/lib/api/response";

interface Context {
  params: Promise<{ environmentId: string; surveyId: string }>;
}

export const OPTIONS = async (): Promise<Response> => {
  return responses.successResponse({}, true);
};

export const GET = async (_req: NextRequest, props: Context): Promise<Response> => {
  const { environmentId, surveyId } = await props.params;

  // Verify the survey belongs to this environment
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: {
      environmentId: true,
      questions: true,
    },
  });

  if (!survey) {
    return responses.notFoundResponse("Survey", surveyId, true);
  }

  if (survey.environmentId !== environmentId) {
    return responses.badRequestResponse("Survey is part of another environment", {}, true);
  }

  // Find questions that have at least one choice with a limit
  const questions = survey.questions as any[];
  const limitedQuestions = questions.filter(
    (q) =>
      (q.type === TSurveyQuestionTypeEnum.MultipleChoiceSingle ||
        q.type === TSurveyQuestionTypeEnum.MultipleChoiceMulti) &&
      Array.isArray(q.choices) &&
      q.choices.some((c: any) => c.limit != null)
  );

  if (limitedQuestions.length === 0) {
    return responses.successResponse({}, true);
  }

  // Fetch all finished responses for this survey
  const allResponses = await prisma.response.findMany({
    where: { surveyId, finished: true },
    select: { data: true },
  });

  // Aggregate counts: { questionId → { choiceId → count } }
  const counts: Record<string, Record<string, number>> = {};

  for (const response of allResponses) {
    const data = response.data as Record<string, any>;

    for (const question of limitedQuestions) {
      const answer = data[question.id];
      if (answer === undefined || answer === null) continue;

      const labels: string[] = Array.isArray(answer) ? answer : [String(answer)];

      for (const label of labels) {
        // Find the matching choice by label value (responses store the label text)
        const choice = question.choices.find((c: any) =>
          Object.values(c.label as Record<string, string>).some((v) => v === label)
        );
        if (!choice) continue;

        counts[question.id] ??= {};
        counts[question.id][choice.id] = (counts[question.id][choice.id] ?? 0) + 1;
      }
    }
  }

  return responses.successResponse(counts, true);
};
