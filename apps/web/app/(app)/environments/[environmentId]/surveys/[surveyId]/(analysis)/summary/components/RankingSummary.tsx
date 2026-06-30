import { TSurvey, TSurveyQuestionSummaryRanking } from "@formbricks/types/surveys/types";
import { convertFloatToNDecimal } from "../lib/utils";
import { QuestionSummaryHeader } from "./QuestionSummaryHeader";

interface RankingSummaryProps {
  questionSummary: TSurveyQuestionSummaryRanking;
  survey: TSurvey;
}

const MEDAL_COLORS = [
  { bg: "#fef9c3", ring: "#fde047", label: "#a16207", icon: "🥇" },
  { bg: "#f1f5f9", ring: "#cbd5e1", label: "#475569", icon: "🥈" },
  { bg: "#fff7ed", ring: "#fed7aa", label: "#92400e", icon: "🥉" },
];

export const RankingSummary = ({ questionSummary, survey }: RankingSummaryProps) => {
  const results = Object.values(questionSummary.choices).sort((a, b) => a.avgRanking - b.avgRanking);

  // For bar width: best rank (lowest avgRanking) = 100%, worst = narrower
  const maxAvg = Math.max(...results.map((r) => r.avgRanking));
  const minAvg = Math.min(...results.map((r) => r.avgRanking));
  const range = maxAvg - minAvg || 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <QuestionSummaryHeader questionSummary={questionSummary} survey={survey} />

      <div className="space-y-3 px-5 pb-6 pt-3" dir="rtl">
        {results.map((result, idx) => {
          const medal = MEDAL_COLORS[idx] ?? { bg: "#f8fafc", ring: "#e2e8f0", label: "#64748b", icon: null };
          // Bar width: #1 rank = 100%, others proportionally less
          const barWidth = 100 - ((result.avgRanking - minAvg) / range) * 60;
          const isTop3 = idx < 3;

          return (
            <div
              key={result.value}
              className="rounded-xl p-4"
              style={{ backgroundColor: medal.bg, border: `1px solid ${medal.ring}` }}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {medal.icon ? (
                    <span className="text-xl leading-none">{medal.icon}</span>
                  ) : (
                    <span
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: "#94a3b8" }}>
                      {idx + 1}
                    </span>
                  )}
                  <span className="font-semibold text-slate-800">{result.value}</span>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="text-xs text-slate-400">متوسط الترتيب</span>
                  <span
                    className="min-w-[3rem] rounded-lg px-2 py-0.5 text-center text-sm font-bold"
                    style={{ backgroundColor: medal.ring, color: medal.label }}>
                    #{convertFloatToNDecimal(result.avgRanking, 1)}
                  </span>
                </div>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/70">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%`, backgroundColor: isTop3 ? medal.ring : "#cbd5e1" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
