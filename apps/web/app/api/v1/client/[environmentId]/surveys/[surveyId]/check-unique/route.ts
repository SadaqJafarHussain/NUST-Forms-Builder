import { type NextRequest } from "next/server";
import { prisma } from "@formbricks/database";
import { responses } from "@/app/lib/api/response";
import { nameSimilarity } from "@/lib/unique-field/similarity";

interface Context {
  params: Promise<{ environmentId: string; surveyId: string }>;
}

export const OPTIONS = async (): Promise<Response> => {
  return responses.successResponse({}, true);
};

export const GET = async (req: NextRequest, props: Context): Promise<Response> => {
  const { environmentId, surveyId } = await props.params;
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId");
  const value = searchParams.get("value")?.trim() ?? "";

  if (!questionId || !value) {
    return responses.badRequestResponse("questionId and value are required", {}, true);
  }

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: { environmentId: true, questions: true },
  });

  if (!survey) return responses.notFoundResponse("Survey", surveyId, true);
  if (survey.environmentId !== environmentId) {
    return responses.badRequestResponse("Survey is part of another environment", {}, true);
  }

  const questions = survey.questions as any[];
  const question = questions.find((q: any) => q.id === questionId);

  if (!question?.uniqueField?.enabled) {
    return responses.successResponse({ isDuplicate: false }, true);
  }

  const { matchType = "exact", threshold = 0.85 } = question.uniqueField;

  // Fetch all finished responses for this survey
  const allResponses = await prisma.response.findMany({
    where: { surveyId, finished: true },
    select: { data: true },
  });

  if (matchType === "exact") {
    const lower = value.toLowerCase();
    const isDuplicate = allResponses.some((r) => {
      const v = (r.data as Record<string, any>)[questionId];
      return typeof v === "string" && v.trim().toLowerCase() === lower;
    });
    return responses.successResponse({ isDuplicate, matchType: "exact" }, true);
  }

  // Fuzzy — score all existing values against the input
  const seen = new Set<string>();
  const matches: { value: string; score: number }[] = [];

  for (const r of allResponses) {
    const v = (r.data as Record<string, any>)[questionId];
    if (typeof v !== "string" || !v.trim()) continue;
    const existing = v.trim();
    const key = existing.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const score = nameSimilarity(value, existing);
    if (score >= threshold) {
      matches.push({ value: existing, score: Math.round(score * 100) / 100 });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  const top = matches.slice(0, 5);

  // Detect partial match: user typed fewer tokens than the best stored name.
  // In this case we prompt them to complete their full name rather than showing
  // the "هل أنت نفس الشخص؟" dialog immediately.
  const inputTokenCount = value
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .split(/\s+/)
    .filter(Boolean).length;

  const bestMatch = top[0];
  const storedTokenCount = bestMatch
    ? bestMatch.value
        .toLowerCase()
        .trim()
        .replace(/[\u064B-\u065F\u0670]/g, "")
        .split(/\s+/)
        .filter(Boolean).length
    : 0;

  const isPartialMatch = top.length > 0 && inputTokenCount < storedTokenCount;

  return responses.successResponse(
    {
      isDuplicate: top.some((m) => m.score >= 0.95) && !isPartialMatch,
      matchType: "fuzzy",
      similarMatches: top,
      isPartialMatch,
      suggestedTokenCount: isPartialMatch ? storedTokenCount : null,
    },
    true
  );
};
