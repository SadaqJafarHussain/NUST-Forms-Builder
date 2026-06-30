"use client";

import { useTranslate } from "@tolgee/react";
import {
  TI18nString,
  TSurvey,
  TSurveyQuestionId,
  TSurveyQuestionSummaryNps,
  TSurveyQuestionTypeEnum,
} from "@formbricks/types/surveys/types";
import { HalfCircle } from "@/modules/ui/components/progress-bar";
import { convertFloatToNDecimal } from "../lib/utils";
import { QuestionSummaryHeader } from "./QuestionSummaryHeader";

interface NPSSummaryProps {
  questionSummary: TSurveyQuestionSummaryNps;
  survey: TSurvey;
  setFilter: (
    questionId: TSurveyQuestionId,
    label: TI18nString,
    questionType: TSurveyQuestionTypeEnum,
    filterValue: string,
    filterComboBoxValue?: string | string[]
  ) => void;
}

const NPS_GROUPS = [
  {
    key: "promoters",
    label: "المروّجون",
    sublabel: "9-10",
    color: "#16a34a",
    bg: "#f0fdf4",
    ring: "#bbf7d0",
  },
  { key: "passives", label: "المحايدون", sublabel: "7-8", color: "#f59e0b", bg: "#fffbeb", ring: "#fde68a" },
  {
    key: "detractors",
    label: "المعارضون",
    sublabel: "0-6",
    color: "#dc2626",
    bg: "#fef2f2",
    ring: "#fecaca",
  },
  {
    key: "dismissed",
    label: "تخطّوا السؤال",
    sublabel: "",
    color: "#94a3b8",
    bg: "#f8fafc",
    ring: "#e2e8f0",
  },
];

export const NPSSummary = ({ questionSummary, survey, setFilter }: NPSSummaryProps) => {
  const { t } = useTranslate();

  const applyFilter = (group: string) => {
    const filters = {
      promoters: { comparison: t("environments.surveys.summary.includes_either"), values: ["9", "10"] },
      passives: { comparison: t("environments.surveys.summary.includes_either"), values: ["7", "8"] },
      detractors: { comparison: t("environments.surveys.summary.is_less_than"), values: "7" },
      dismissed: { comparison: t("common.skipped"), values: undefined },
    };
    const filter = filters[group];
    if (filter) {
      setFilter(
        questionSummary.question.id,
        questionSummary.question.headline,
        questionSummary.question.type,
        filter.comparison,
        filter.values
      );
    }
  };

  const score = Math.round(questionSummary.score);
  const scoreColor = score >= 50 ? "#16a34a" : score >= 0 ? "#f59e0b" : "#dc2626";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <QuestionSummaryHeader questionSummary={questionSummary} survey={survey} />

      {/* NPS Score banner */}
      <div
        className="mx-5 mb-5 mt-2 flex items-center justify-between rounded-xl p-4"
        style={{ backgroundColor: `${scoreColor}0d`, border: `1px solid ${scoreColor}33` }}
        dir="rtl">
        <div>
          <p className="text-xs font-medium text-slate-500">درجة NPS</p>
          <p className="text-5xl font-bold" style={{ color: scoreColor }}>
            {score}
          </p>
          <p className="text-xs text-slate-400">من -100 إلى 100</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-600">
            {score >= 50 ? "ممتاز 🎉" : score >= 0 ? "جيد 👍" : "يحتاج تحسين ⚠️"}
          </p>
          <p className="mt-1 text-xs text-slate-400">{questionSummary.responseCount} مشارك</p>
        </div>
      </div>

      {/* Group bars */}
      <div className="space-y-3 px-5 pb-5" dir="rtl">
        {NPS_GROUPS.map(({ key, label, sublabel, color, bg, ring }) => {
          const data = questionSummary[key];
          if (!data) return null;
          return (
            <button
              key={key}
              className="group w-full cursor-pointer rounded-xl p-4 text-right transition-all hover:shadow-sm"
              style={{ backgroundColor: bg, border: `1px solid ${ring}` }}
              onClick={() => applyFilter(key)}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-semibold text-slate-800">{label}</span>
                  {sublabel && <span className="text-xs text-slate-400">({sublabel})</span>}
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <span className="text-sm text-slate-500">{data.count} رد</span>
                  <span
                    className="min-w-[3.5rem] rounded-lg px-2 py-0.5 text-center text-sm font-bold text-white"
                    style={{ backgroundColor: color }}>
                    {convertFloatToNDecimal(data.percentage, 1)}%
                  </span>
                </div>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/60">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${data.percentage}%`, backgroundColor: color }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Half circle gauge */}
      <div className="flex justify-center border-t border-slate-100 py-6">
        <HalfCircle value={questionSummary.score} />
      </div>
    </div>
  );
};
