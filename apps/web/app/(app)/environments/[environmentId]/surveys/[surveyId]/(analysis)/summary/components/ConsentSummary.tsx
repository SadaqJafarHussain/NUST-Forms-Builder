"use client";

import { useTranslate } from "@tolgee/react";
import {
  TI18nString,
  TSurvey,
  TSurveyQuestionId,
  TSurveyQuestionSummaryConsent,
  TSurveyQuestionTypeEnum,
} from "@formbricks/types/surveys/types";
import { convertFloatToNDecimal } from "../lib/utils";
import { QuestionSummaryHeader } from "./QuestionSummaryHeader";

interface ConsentSummaryProps {
  questionSummary: TSurveyQuestionSummaryConsent;
  survey: TSurvey;
  setFilter: (
    questionId: TSurveyQuestionId,
    label: TI18nString,
    questionType: TSurveyQuestionTypeEnum,
    filterValue: string,
    filterComboBoxValue?: string | string[]
  ) => void;
}

export const ConsentSummary = ({ questionSummary, survey, setFilter }: ConsentSummaryProps) => {
  const { t } = useTranslate();
  const summaryItems = [
    {
      key: t("common.accepted"),
      label: "وافق",
      sublabel: "قبل الشروط",
      percentage: questionSummary.accepted.percentage,
      count: questionSummary.accepted.count,
      color: "#16a34a",
      bg: "#f0fdf4",
      ring: "#bbf7d0",
      icon: "✓",
    },
    {
      key: t("common.dismissed"),
      label: "رفض",
      sublabel: "لم يقبل الشروط",
      percentage: questionSummary.dismissed.percentage,
      count: questionSummary.dismissed.count,
      color: "#dc2626",
      bg: "#fef2f2",
      ring: "#fecaca",
      icon: "✕",
    },
  ];

  const total = questionSummary.accepted.count + questionSummary.dismissed.count;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <QuestionSummaryHeader questionSummary={questionSummary} survey={survey} />

      {/* Summary banner */}
      <div className="mx-5 mb-5 mt-2 grid grid-cols-2 gap-3" dir="rtl">
        {summaryItems.map((item) => (
          <div
            key={item.key}
            className="flex flex-col items-center justify-center rounded-xl p-4 text-center"
            style={{ backgroundColor: item.bg, border: `1px solid ${item.ring}` }}>
            <span className="mb-1 text-2xl font-bold" style={{ color: item.color }}>
              {item.icon}
            </span>
            <p className="text-3xl font-bold" style={{ color: item.color }}>
              {convertFloatToNDecimal(item.percentage, 1)}%
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-700">{item.label}</p>
            <p className="text-xs text-slate-400">
              {item.count} من {total}
            </p>
          </div>
        ))}
      </div>

      {/* Bars */}
      <div className="space-y-3 px-5 pb-5" dir="rtl">
        {summaryItems.map((item) => (
          <button
            key={item.key}
            className="group w-full cursor-pointer rounded-xl p-4 text-right transition-all hover:shadow-sm"
            style={{ backgroundColor: item.bg, border: `1px solid ${item.ring}` }}
            onClick={() =>
              setFilter(
                questionSummary.question.id,
                questionSummary.question.headline,
                questionSummary.question.type,
                "is",
                item.key
              )
            }>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: item.color }}>
                  {item.icon}
                </span>
                <span className="font-semibold text-slate-800">{item.label}</span>
                <span className="text-xs text-slate-400">{item.sublabel}</span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <span className="text-sm text-slate-500">{item.count} رد</span>
                <span
                  className="min-w-[3.5rem] rounded-lg px-2 py-0.5 text-center text-sm font-bold text-white"
                  style={{ backgroundColor: item.color }}>
                  {convertFloatToNDecimal(item.percentage, 1)}%
                </span>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/60">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
