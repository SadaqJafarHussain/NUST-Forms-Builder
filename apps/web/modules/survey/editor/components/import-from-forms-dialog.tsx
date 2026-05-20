"use client";

import { createId } from "@paralleldrive/cuid2";
import { useTranslate } from "@tolgee/react";
import { FileTextIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
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

function getHeadline(q: TSurveyQuestion): string {
  return getLocalizedValue(q.headline, "default") || "سؤال";
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
      <div className="flex h-[82vh] w-[880px] max-w-[96vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
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

        {/* ── Body ── */}
        <div className="flex min-h-0 flex-1">
          {/* Left pane — forms list ────────────────────────── */}
          <div className="flex w-72 shrink-0 flex-col border-l border-slate-200">
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

            {/* Count footer */}
            <div className="border-t border-slate-100 px-4 py-2 text-center text-xs text-slate-400">
              {filteredSurveys.length} نموذج
            </div>
          </div>

          {/* Right pane — questions ──────────────────────────── */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {!selectedSurvey ? (
              /* Empty state */
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
                        return (
                          <div
                            key={q.id ?? idx}
                            className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-slate-300 hover:shadow-sm">
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
                                {/* Type icon */}
                                <span className="inline-flex h-4 w-4 items-center text-slate-400">
                                  {QUESTIONS_ICON_MAP[q.type]}
                                </span>
                                {/* Type label */}
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                  {typeLabel}
                                </span>
                                {/* Metadata */}
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
        </div>
      </div>
    </div>
  );
};
