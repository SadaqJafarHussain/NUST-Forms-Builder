"use client";

import { createId } from "@paralleldrive/cuid2";
import { useTranslate } from "@tolgee/react";
import { EyeIcon, FileTextIcon, PlusIcon, SearchIcon, StarIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { TSurveyQuestion } from "@formbricks/types/surveys/types";
import { getLocalizedValue } from "@/lib/i18n/utils";
import { getSurveysForImportAction } from "@/lib/question-bank/actions";
import { getQuestionMeta } from "@/modules/survey/editor/components/question-suggestion-strip";
import { getQuestionIconMap } from "@/modules/survey/lib/questions";

// ── Arabic type labels ─────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  openText: "نص مفتوح",
  multipleChoiceSingle: "اختيار واحد",
  multipleChoiceMulti: "اختيار متعدد",
  rating: "تقييم",
  nps: "NPS",
  date: "تاريخ",
  fileUpload: "رفع ملف",
  matrix: "مصفوفة",
  ranking: "ترتيب",
  consent: "موافقة",
  cta: "زر الإجراء",
  cal: "حجز موعد",
  address: "عنوان",
  contactInfo: "بيانات تواصل",
  pictureSelection: "اختيار صورة",
};

const tv = (val: any): string => {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val.ar ?? val.default ?? Object.values(val)[0] ?? "";
};

function getHeadline(q: TSurveyQuestion): string {
  return getLocalizedValue(q.headline, "default") || "سؤال";
}

// ── Live question preview — renders exactly like the actual survey ─────────────
function LiveQuestionPreview({ q }: { q: TSurveyQuestion }) {
  const headline = getHeadline(q);
  const subheader = tv((q as any).subheader);

  return (
    <div className="pointer-events-none select-none" dir="rtl">
      {/* Question card */}
      <div
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        style={{ borderTop: "4px solid #1b335f" }}>
        {/* Question text */}
        <p className="text-sm font-semibold leading-relaxed text-slate-800">{headline}</p>
        {subheader && <p className="mt-1 text-xs text-slate-500">{subheader}</p>}
        {(q as any).required && <span className="mt-1 inline-block text-xs text-red-500">* إلزامي</span>}

        <div className="mt-4">
          <QuestionInputPreview q={q} />
        </div>
      </div>

      {/* Submit button mockup */}
      <div className="mt-3 flex justify-center">
        <div
          className="rounded-lg px-6 py-2 text-xs font-medium text-white"
          style={{ backgroundColor: "#1b335f" }}>
          إرسال
        </div>
      </div>
    </div>
  );
}

function QuestionInputPreview({ q }: { q: TSurveyQuestion }) {
  if (q.type === "openText") {
    const isLong = (q as any).longAnswer !== false;
    return isLong ? (
      <div className="w-full rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-400">
        اكتب إجابتك هنا...
      </div>
    ) : (
      <div className="w-full rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-400">
        إجابة قصيرة...
      </div>
    );
  }

  if (q.type === "multipleChoiceSingle" || q.type === "multipleChoiceMulti") {
    const choices = (q as any).choices ?? [];
    const isMulti = q.type === "multipleChoiceMulti";
    return (
      <div className="space-y-2">
        {choices.slice(0, 6).map((c: any, i: number) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700">
            <div
              className={`flex h-4 w-4 shrink-0 items-center justify-center border ${isMulti ? "rounded" : "rounded-full"}`}
              style={{ borderColor: "#1b335f" }}
            />
            <span>{tv(c.label) || `خيار ${i + 1}`}</span>
          </div>
        ))}
        {choices.length > 6 && (
          <p className="text-center text-[10px] text-slate-400">+ {choices.length - 6} خيارات أخرى</p>
        )}
      </div>
    );
  }

  if (q.type === "rating") {
    const range = (q as any).range ?? 5;
    const isStars = (q as any).scale === "star";
    return (
      <div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: range }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-xs font-bold text-slate-500">
              {isStars ? <StarIcon className="h-4 w-4 text-slate-300" /> : n}
            </div>
          ))}
        </div>
        {((q as any).lowerLabel || (q as any).upperLabel) && (
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>{tv((q as any).lowerLabel)}</span>
            <span>{tv((q as any).upperLabel)}</span>
          </div>
        )}
      </div>
    );
  }

  if (q.type === "nps") {
    return (
      <div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <div
              key={n}
              className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-slate-200 bg-white text-xs font-bold text-slate-500">
              {n}
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          <span>{tv((q as any).lowerLabel) || "غير محتمل"}</span>
          <span>{tv((q as any).upperLabel) || "محتمل جداً"}</span>
        </div>
      </div>
    );
  }

  if (q.type === "date") {
    return (
      <div className="w-full rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-400">
        يوم / شهر / سنة
      </div>
    );
  }

  if (q.type === "matrix") {
    const rows = (q as any).rows ?? [];
    const cols = (q as any).columns ?? [];
    return (
      <div className="overflow-x-auto rounded-xl">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: "#eef2f9" }}>
              <th className="w-28 py-2 pr-3 text-right font-semibold text-slate-600" />
              {cols.slice(0, 4).map((col: any, i: number) => (
                <th key={i} className="px-2 py-2 text-center font-semibold text-slate-700">
                  {tv(col.label) || `ع${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 4).map((row: any, ri: number) => (
              <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? "#fff" : "#f8fafc" }}>
                <td className="py-2 pr-3 font-medium text-slate-700">{tv(row.label) || `صف ${ri + 1}`}</td>
                {cols.slice(0, 4).map((_: any, ci: number) => (
                  <td key={ci} className="px-2 py-2 text-center">
                    <div className="mx-auto h-3.5 w-3.5 rounded-full border border-slate-300" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {(rows.length > 4 || cols.length > 4) && (
          <p className="mt-1 text-center text-[10px] text-slate-400">
            {rows.length} صفوف × {cols.length} أعمدة
          </p>
        )}
      </div>
    );
  }

  if (q.type === "ranking") {
    const choices = (q as any).choices ?? [];
    return (
      <div className="space-y-2">
        {choices.slice(0, 5).map((c: any, i: number) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
              style={{ backgroundColor: "#1b335f" }}>
              {i + 1}
            </span>
            <span>{tv(c.label) || `عنصر ${i + 1}`}</span>
          </div>
        ))}
        {choices.length > 5 && (
          <p className="text-center text-[10px] text-slate-400">+ {choices.length - 5} عناصر أخرى</p>
        )}
      </div>
    );
  }

  if (q.type === "fileUpload") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-6 text-xs text-slate-400">
        <span className="text-lg">📎</span>
        <span className="mt-1">انقر لرفع ملف</span>
      </div>
    );
  }

  if (q.type === "consent") {
    const label = tv((q as any).label);
    return (
      <div className="flex items-start gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-xs text-slate-700">
        <div className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-slate-300" />
        <span>{label || "أوافق على الشروط والأحكام"}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-4 text-center text-xs text-slate-400">
      {TYPE_LABELS[q.type] ?? q.type}
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface ImportFromFormsDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  environmentId: string;
  currentSurveyId: string;
  onAddQuestion: (question: TSurveyQuestion) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const ImportFromFormsDialog = ({
  open,
  setOpen,
  environmentId,
  currentSurveyId,
  onAddQuestion,
}: ImportFromFormsDialogProps) => {
  const { t } = useTranslate();
  const QUESTIONS_ICON_MAP = getQuestionIconMap(t);

  const [surveys, setSurveys] = useState<Array<{ id: string; name: string; questions: TSurveyQuestion[] }>>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [formSearch, setFormSearch] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");
  const [previewQuestion, setPreviewQuestion] = useState<TSurveyQuestion | null>(null);

  const loadSurveys = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getSurveysForImportAction({ environmentId });
      if (result?.data) {
        const usable = result.data.filter((s) => s.id !== currentSurveyId && s.questions.length > 0);
        setSurveys(usable);
      }
    } catch {
      toast.error("حدث خطأ أثناء تحميل النماذج");
    } finally {
      setIsLoading(false);
    }
  }, [environmentId, currentSurveyId]);

  useEffect(() => {
    if (open) {
      loadSurveys();
      setSelectedSurveyId(null);
      setFormSearch("");
      setQuestionSearch("");
      setPreviewQuestion(null);
    }
  }, [open, loadSurveys]);

  const filteredSurveys = useMemo(
    () => surveys.filter((s) => !formSearch || s.name.toLowerCase().includes(formSearch.toLowerCase())),
    [surveys, formSearch]
  );

  const selectedSurvey = useMemo(
    () => surveys.find((s) => s.id === selectedSurveyId) ?? null,
    [surveys, selectedSurveyId]
  );

  const filteredQuestions = useMemo(() => {
    if (!selectedSurvey) return [];
    if (!questionSearch) return selectedSurvey.questions;
    return selectedSurvey.questions.filter((q) =>
      getHeadline(q).toLowerCase().includes(questionSearch.toLowerCase())
    );
  }, [selectedSurvey, questionSearch]);

  const handleAdd = (q: TSurveyQuestion) => {
    onAddQuestion({ ...q, id: createId() });
    toast.success("تمت إضافة السؤال");
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}>
      {/* Dialog — wider to fit 3 panes */}
      <div className="flex h-[85vh] w-[1160px] max-w-[96vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ── Header ── */}
        <div
          className="flex shrink-0 items-center justify-between px-5 py-4"
          style={{ backgroundColor: "#1b335f" }}>
          <div className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" style={{ color: "#f4bf00" }} />
            <span className="text-base font-semibold text-white">استيراد من نموذج محفوظ</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body — 3 panes ── */}
        <div className="flex min-h-0 flex-1">
          {/* Pane 1 — Forms list (RIGHT in RTL) ─────────────────────────── */}
          <div className="flex w-56 shrink-0 flex-col border-l border-slate-200">
            {/* Search */}
            <div className="border-b border-slate-100 p-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <SearchIcon className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث في النماذج..."
                  value={formSearch}
                  onChange={(e) => setFormSearch(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                />
                {formSearch && (
                  <button type="button" onClick={() => setFormSearch("")}>
                    <XIcon className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-14">
                  <div
                    className="h-6 w-6 animate-spin rounded-full border-b-2"
                    style={{ borderColor: "#1b335f" }}
                  />
                </div>
              ) : filteredSurveys.length === 0 ? (
                <div className="py-14 text-center text-sm text-slate-400">
                  {surveys.length === 0 ? "لا توجد نماذج أخرى" : "لا توجد نتائج"}
                </div>
              ) : (
                filteredSurveys.map((s) => {
                  const isSelected = selectedSurveyId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSurveyId(s.id);
                        setQuestionSearch("");
                        setPreviewQuestion(null);
                      }}
                      className="mb-1 w-full rounded-lg px-3 py-2.5 text-right transition-colors"
                      style={isSelected ? { backgroundColor: "#1b335f" } : {}}>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="flex-1 truncate text-sm font-medium"
                          style={{ color: isSelected ? "#fff" : "#1e293b" }}>
                          {s.name}
                        </p>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-xs"
                          style={
                            isSelected
                              ? { backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }
                              : { backgroundColor: "#e2e8f0", color: "#64748b" }
                          }>
                          {s.questions.length}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-4 py-2 text-center text-xs text-slate-400">
              {filteredSurveys.length} نموذج
            </div>
          </div>

          {/* Pane 2 — Questions list (MIDDLE) ────────────────────────────── */}
          <div className="flex w-80 shrink-0 flex-col border-l border-slate-200">
            {!selectedSurvey ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <FileTextIcon className="mb-3 h-12 w-12 text-slate-200" />
                <p className="text-base font-medium text-slate-500">اختر نموذجاً</p>
                <p className="mt-1 text-sm text-slate-400">انقر على أي نموذج من القائمة لعرض أسئلته</p>
              </div>
            ) : (
              <>
                {/* Form header */}
                <div className="shrink-0 border-b border-slate-200 px-4 py-3">
                  <h3 className="font-semibold text-slate-800">{selectedSurvey.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-400">{selectedSurvey.questions.length} أسئلة</p>
                </div>

                {/* Question search */}
                <div className="shrink-0 border-b border-slate-100 p-3">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <SearchIcon className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type="text"
                      placeholder="بحث في أسئلة هذا النموذج..."
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                    />
                    {questionSearch && (
                      <button type="button" onClick={() => setQuestionSearch("")}>
                        <XIcon className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Questions list */}
                <div className="flex-1 overflow-y-auto p-3">
                  {filteredQuestions.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">
                      {selectedSurvey.questions.length === 0
                        ? "هذا النموذج لا يحتوي على أسئلة"
                        : "لا توجد نتائج"}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredQuestions.map((q, idx) => {
                        const headline = getHeadline(q);
                        const meta = getQuestionMeta(q);
                        const typeLabel = TYPE_LABELS[q.type] ?? q.type;
                        const isHovered = previewQuestion?.id === q.id;
                        return (
                          <div
                            key={q.id ?? idx}
                            className="group flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all"
                            style={
                              isHovered
                                ? { borderColor: "#1b335f", backgroundColor: "#f0f4fa" }
                                : { borderColor: "#e2e8f0", backgroundColor: "#fff" }
                            }
                            onMouseEnter={() => setPreviewQuestion(q)}
                            onMouseLeave={() =>
                              setPreviewQuestion((prev) => (prev?.id === q.id ? prev : prev))
                            }>
                            {/* Number badge */}
                            <div
                              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                              style={{ backgroundColor: "#1b335f" }}>
                              {idx + 1}
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium leading-relaxed text-slate-800">{headline}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex h-4 w-4 items-center text-slate-400">
                                  {QUESTIONS_ICON_MAP[q.type]}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                  {typeLabel}
                                </span>
                                {meta && (
                                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                                    {meta}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Add button */}
                            <button
                              type="button"
                              onClick={() => handleAdd(q)}
                              className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
                              style={{ backgroundColor: "#1b335f" }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0f314c")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1b335f")}>
                              <PlusIcon className="h-3.5 w-3.5" />
                              إضافة
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Count footer */}
                <div className="shrink-0 border-t border-slate-100 px-4 py-2 text-center text-xs text-slate-400">
                  {filteredQuestions.length} {filteredQuestions.length === 1 ? "سؤال" : "أسئلة"}
                </div>
              </>
            )}
          </div>

          {/* Pane 3 — Live question preview (LEFT in RTL) ─────────────────── */}
          <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
            {/* Header */}
            <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <EyeIcon className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">معاينة السؤال</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">مرّر المؤشر على سؤال لمعاينته</p>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-y-auto p-5">
              {previewQuestion ? (
                <LiveQuestionPreview q={previewQuestion} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <EyeIcon className="mb-3 h-12 w-12 text-slate-200" />
                  <p className="text-sm font-medium text-slate-400">لا يوجد سؤال محدد</p>
                  <p className="mt-1 text-xs text-slate-300">مرّر المؤشر على أي سؤال لرؤية معاينته هنا</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
