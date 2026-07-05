"use client";

import {
  TI18nString,
  TSurvey,
  TSurveyQuestionId,
  TSurveyQuestionSummaryDropdown,
  TSurveyQuestionTypeEnum,
} from "@formbricks/types/surveys/types";
import { convertFloatToNDecimal } from "../lib/utils";
import { QuestionSummaryHeader } from "./QuestionSummaryHeader";

interface DropdownSummaryProps {
  questionSummary: TSurveyQuestionSummaryDropdown;
  environmentId: string;
  survey: TSurvey;
  setFilter: (
    questionId: TSurveyQuestionId,
    label: TI18nString,
    questionType: TSurveyQuestionTypeEnum,
    filterValue: string,
    filterComboBoxValue?: string | string[]
  ) => void;
}

export const DropdownSummary = ({ questionSummary, survey, setFilter }: DropdownSummaryProps) => {
  const palette = ["#1b335f", "#2563eb", "#16a34a", "#f4bf00", "#7c3aed", "#ea580c", "#0891b2"];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <QuestionSummaryHeader questionSummary={questionSummary} survey={survey} />
      <div className="space-y-4 px-4 pb-6 pt-4 md:px-6" dir="rtl">
        {questionSummary.choices.length === 0 ? (
          <p className="text-center text-sm text-slate-400">لا توجد ردود بعد</p>
        ) : (
          questionSummary.choices.map((result, idx) => {
            const color = palette[idx % palette.length];
            const pct = convertFloatToNDecimal(result.percentage, 1);
            return (
              <button
                key={result.value}
                type="button"
                className="group w-full cursor-pointer rounded-xl border border-slate-100 bg-slate-50 p-4 text-right transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm"
                onClick={() =>
                  setFilter(
                    questionSummary.question.id,
                    questionSummary.question.headline,
                    questionSummary.question.type,
                    "includesEither",
                    [result.value]
                  )
                }>
                {/* Label + stats row */}
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: color }}>
                      {idx + 1}
                    </span>
                    <p className="font-semibold text-slate-800 underline-offset-4 group-hover:underline">
                      {result.value}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <span className="text-sm text-slate-500">{result.count} رد</span>
                    <span
                      className="min-w-[3.5rem] rounded-lg px-2 py-0.5 text-center text-base font-bold text-white"
                      style={{ backgroundColor: color }}>
                      {pct}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${result.percentage}%`, backgroundColor: color }}
                  />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
