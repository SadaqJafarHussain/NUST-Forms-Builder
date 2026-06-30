"use client";

import { useTranslate } from "@tolgee/react";
import { CircleSlash2, SmileIcon, StarIcon } from "lucide-react";
import { useMemo } from "react";
import {
  TI18nString,
  TSurvey,
  TSurveyQuestionId,
  TSurveyQuestionSummaryRating,
  TSurveyQuestionTypeEnum,
} from "@formbricks/types/surveys/types";
import { convertFloatToNDecimal } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/lib/utils";
import { RatingResponse } from "@/modules/ui/components/rating-response";
import { QuestionSummaryHeader } from "./QuestionSummaryHeader";

interface RatingSummaryProps {
  questionSummary: TSurveyQuestionSummaryRating;
  survey: TSurvey;
  setFilter: (
    questionId: TSurveyQuestionId,
    label: TI18nString,
    questionType: TSurveyQuestionTypeEnum,
    filterValue: string,
    filterComboBoxValue?: string | string[]
  ) => void;
}

export const RatingSummary = ({ questionSummary, survey, setFilter }: RatingSummaryProps) => {
  const { t } = useTranslate();

  const range = questionSummary.question.range ?? 5;

  // Color gradient: red for low, green for high
  const getBarColor = (rating: number) => {
    const ratio = (rating - 1) / (range - 1);
    if (ratio <= 0.25) return "#dc2626"; // red
    if (ratio <= 0.5) return "#f59e0b"; // amber
    if (ratio <= 0.75) return "#f4bf00"; // gold
    return "#16a34a"; // green
  };

  const scaleIcon = useMemo(() => {
    const scale = questionSummary.question.scale;
    if (scale === "star") return <StarIcon fill="rgb(250 204 21)" className="h-5 w-5 text-yellow-400" />;
    if (scale === "smiley") return <SmileIcon className="h-5 w-5 text-amber-500" />;
    return <CircleSlash2 className="h-5 w-5 text-slate-500" />;
  }, [questionSummary]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <QuestionSummaryHeader
        questionSummary={questionSummary}
        survey={survey}
        additionalInfo={
          <div className="flex items-center gap-1.5">
            {scaleIcon}
            <span>
              المتوسط: <strong>{questionSummary.average.toFixed(1)}</strong> / {range}
            </span>
          </div>
        }
      />

      {/* Average score banner */}
      <div
        className="mx-5 mb-4 mt-2 flex items-center justify-between rounded-xl p-4"
        style={{ backgroundColor: "#1b335f0d", border: "1px solid #1b335f22" }}
        dir="rtl">
        <div>
          <p className="text-xs font-medium text-slate-500">متوسط التقييم</p>
          <p className="text-4xl font-bold" style={{ color: "#1b335f" }}>
            {questionSummary.average.toFixed(1)}
          </p>
          <p className="text-xs text-slate-400">من أصل {range}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          {scaleIcon}
          <span className="text-xs text-slate-400">{questionSummary.responseCount} رد</span>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-6" dir="rtl">
        {questionSummary.choices.map((result) => {
          const color = getBarColor(result.rating);
          return (
            <button
              className="group w-full cursor-pointer rounded-xl border border-slate-100 bg-slate-50 p-3 text-right transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm"
              key={result.rating}
              onClick={() =>
                setFilter(
                  questionSummary.question.id,
                  questionSummary.question.headline,
                  questionSummary.question.type,
                  t("environments.surveys.summary.is_equal_to"),
                  result.rating.toString()
                )
              }>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <RatingResponse
                    scale={questionSummary.question.scale}
                    answer={result.rating}
                    range={range}
                    addColors={questionSummary.question.isColorCodingEnabled}
                  />
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <span className="text-sm text-slate-500">{result.count} رد</span>
                  <span
                    className="min-w-[3.5rem] rounded-lg px-2 py-0.5 text-center text-sm font-bold text-white"
                    style={{ backgroundColor: color }}>
                    {convertFloatToNDecimal(result.percentage, 1)}%
                  </span>
                </div>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${result.percentage}%`, backgroundColor: color }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {questionSummary.dismissed && questionSummary.dismissed.count > 0 && (
        <div
          className="mx-5 mb-5 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          dir="rtl">
          <span className="text-sm font-medium text-slate-500">تخطّى السؤال</span>
          <span className="text-sm text-slate-400">{questionSummary.dismissed.count} رد</span>
        </div>
      )}
    </div>
  );
};
