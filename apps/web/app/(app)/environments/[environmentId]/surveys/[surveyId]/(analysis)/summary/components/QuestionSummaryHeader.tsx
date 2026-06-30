"use client";

import { useTranslate } from "@tolgee/react";
import { InboxIcon } from "lucide-react";
import type { JSX } from "react";
import { TSurvey, TSurveyQuestionSummary } from "@formbricks/types/surveys/types";
import { recallToHeadline } from "@/lib/utils/recall";
import { formatTextWithSlashes } from "@/modules/survey/editor/lib/utils";
import { getQuestionTypes } from "@/modules/survey/lib/questions";

interface HeadProps {
  questionSummary: TSurveyQuestionSummary;
  showResponses?: boolean;
  additionalInfo?: JSX.Element;
  survey: TSurvey;
}

export const QuestionSummaryHeader = ({
  questionSummary,
  additionalInfo,
  showResponses = true,
  survey,
}: HeadProps) => {
  const { t } = useTranslate();
  const questionType = getQuestionTypes(t).find((type) => type.id === questionSummary.question.type);
  const questionIndex = survey.questions.findIndex((q) => q.id === questionSummary.question.id);

  return (
    <div dir="rtl" style={{ borderTop: "4px solid #1b335f" }} className="rounded-t-xl">
      <div className="px-5 pb-4 pt-5 md:px-6">
        {/* Question number + title */}
        <div className="mb-3 flex items-start gap-3">
          {questionIndex >= 0 && (
            <span
              className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: "#1b335f" }}>
              {questionIndex + 1}
            </span>
          )}
          <h3 className="text-lg font-bold leading-snug text-slate-900 md:text-xl">
            {formatTextWithSlashes(
              recallToHeadline(questionSummary.question.headline, survey, true, "default")["default"],
              "@",
              ["text-lg"]
            )}
          </h3>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {questionType && (
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-white"
              style={{ backgroundColor: "#1b335f" }}>
              <questionType.icon className="h-3.5 w-3.5" />
              {questionType.label}
            </span>
          )}
          {showResponses && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200">
              <InboxIcon className="h-3.5 w-3.5" />
              {questionSummary.responseCount} رد
            </span>
          )}
          {additionalInfo && (
            <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-blue-700 ring-1 ring-blue-200">
              {additionalInfo}
            </span>
          )}
          {!questionSummary.question.required && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">اختياري</span>
          )}
        </div>
      </div>
    </div>
  );
};
