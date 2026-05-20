"use client";

import { useTranslate } from "@tolgee/react";
import { ChevronDownIcon, SparklesIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { TSurveyQuestion } from "@formbricks/types/surveys/types";
import { getQuestionIconMap } from "@/modules/survey/lib/questions";

// ── Shared type (imported by questions-view and question-card) ────────────────
export interface SuggestionQuestion {
  questionData: TSurveyQuestion;
  headline: string;
  type: string;
  sourceName: string; // survey name, or "بنك الأسئلة"
  isFromBank: boolean;
  metadata: string; // e.g. "5 خيارات", "1–5", "3 × 4"
}

// ── Metadata helper (also exported for use in import dialog) ─────────────────
export function getQuestionMeta(q: TSurveyQuestion): string {
  const type = q.type;
  if (type === "multipleChoiceSingle" || type === "multipleChoiceMulti") {
    const count = (q as any).choices?.length ?? 0;
    return count ? `${count} خيارات` : "";
  }
  if (type === "rating") return `1–${(q as any).range ?? 5}`;
  if (type === "nps") return "0–10";
  if (type === "matrix") {
    const rows = (q as any).rows?.length ?? 0;
    const cols = (q as any).columns?.length ?? 0;
    return rows && cols ? `${rows} × ${cols}` : "";
  }
  return "";
}

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

// ── Component ─────────────────────────────────────────────────────────────────
interface QuestionSuggestionStripProps {
  headline: string;
  questionType: string;
  suggestions: SuggestionQuestion[];
  onSelect: (question: TSurveyQuestion) => void;
}

export const QuestionSuggestionStrip = ({
  headline,
  questionType,
  suggestions,
  onSelect,
}: QuestionSuggestionStripProps) => {
  const { t } = useTranslate();
  const QUESTIONS_ICON_MAP = getQuestionIconMap(t);
  const [expanded, setExpanded] = useState(true);

  const normalizedHeadline = normalize(headline);

  const matched = useMemo(() => {
    if (normalizedHeadline.length < 2) return [];
    return suggestions
      .filter((s) => {
        if (s.type !== questionType) return false;
        const sn = normalize(s.headline);
        return sn.includes(normalizedHeadline) || normalizedHeadline.includes(sn);
      })
      .slice(0, 5)
      .map((s) => ({
        ...s,
        isIdentical: normalize(s.headline) === normalizedHeadline,
      }));
  }, [suggestions, normalizedHeadline]);

  if (matched.length === 0) return null;

  return (
    <div
      className="mb-3 overflow-hidden rounded-lg border"
      style={{ borderColor: "#f4bf00", backgroundColor: "#fffdf0" }}>
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-3.5 w-3.5" style={{ color: "#f4bf00" }} />
          <span className="text-xs font-semibold" style={{ color: "#1b335f" }}>
            اقتراحات مشابهة ({matched.length})
          </span>
        </div>
        <ChevronDownIcon
          className="h-3.5 w-3.5 transition-transform duration-200"
          style={{
            color: "#808ba3",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {expanded && (
        <div className="space-y-1.5 border-t px-3 py-2" style={{ borderColor: "#fef3c7" }}>
          {matched.map((s, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white p-2.5 transition-all hover:border-slate-200 hover:shadow-sm">
              {/* Type icon */}
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-50 text-slate-500">
                {QUESTIONS_ICON_MAP[s.type]}
              </div>

              {/* Text + badges */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-snug text-slate-800">{s.headline}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {/* Source */}
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={
                      s.isFromBank
                        ? { backgroundColor: "#f0f4f8", color: "#1b335f" }
                        : { backgroundColor: "#e0f2fe", color: "#0369a1" }
                    }>
                    {s.isFromBank ? "بنك الأسئلة" : s.sourceName}
                  </span>
                  {/* Metadata */}
                  {s.metadata && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {s.metadata}
                    </span>
                  )}
                  {/* Identical badge */}
                  {s.isIdentical && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
                      مطابق
                    </span>
                  )}
                </div>
              </div>

              {/* Use button */}
              <button
                type="button"
                onClick={() => onSelect(s.questionData)}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white transition-colors"
                style={{ backgroundColor: "#1b335f" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0f314c")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1b335f")}>
                استخدم
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
