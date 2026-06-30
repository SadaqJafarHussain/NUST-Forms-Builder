"use client";

import { createId } from "@paralleldrive/cuid2";
import { useTranslate } from "@tolgee/react";
import { BookmarkIcon, PlusIcon, SearchIcon, TrashIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { TSurveyQuestion } from "@formbricks/types/surveys/types";
import { getLocalizedValue } from "@/lib/i18n/utils";
import { deleteFromQuestionBankAction, getQuestionsAction } from "@/lib/question-bank/actions";
import { getQuestionIconMap, getQuestionTypes } from "@/modules/survey/lib/questions";

interface QuestionBankItem {
  id: string;
  questionData: TSurveyQuestion;
  type: string;
  category: string | null;
  usageCount: number;
  createdAt: Date;
}

interface QuestionBankPanelProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  environmentId: string;
  onAddQuestion: (question: TSurveyQuestion) => void;
}

export const QuestionBankModal = ({
  open,
  setOpen,
  environmentId,
  onAddQuestion,
}: QuestionBankPanelProps) => {
  const { t } = useTranslate();
  const QUESTIONS_ICON_MAP = getQuestionIconMap(t);
  const questionTypes = getQuestionTypes(t);
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getQuestionsAction({ environmentId });
      if (result?.data) {
        setQuestions(result.data);
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  }, [environmentId]);

  useEffect(() => {
    if (open) {
      fetchQuestions();
    }
  }, [open, fetchQuestions]);

  const getQuestionHeadline = (question: TSurveyQuestion): string =>
    getLocalizedValue(question.headline, "default") || "سؤال";

  const filteredQuestions = useMemo(() => {
    return questions.filter((item) => {
      const headline = getQuestionHeadline(item.questionData).toLowerCase();
      const matchesSearch = !searchQuery || headline.includes(searchQuery.toLowerCase());
      const matchesType = !selectedType || item.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [questions, searchQuery, selectedType]);

  const handleAddQuestion = (item: QuestionBankItem) => {
    const newQuestion: TSurveyQuestion = { ...item.questionData, id: createId() };
    onAddQuestion(newQuestion);
    toast.success("تمت إضافة السؤال");
    // Panel stays open — Google Forms style (user can keep adding)
  };

  const handleDeleteQuestion = async (questionId: string) => {
    setDeletingId(questionId);
    try {
      const result = await deleteFromQuestionBankAction({ environmentId, questionId });
      if (result?.data?.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        toast.success("تم حذف السؤال");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setDeletingId(null);
    }
  };

  if (!open) return null;

  return (
    // Overlay + side panel
    <div className="fixed inset-0 z-40 flex" dir="rtl">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20" onClick={() => setOpen(false)} />

      {/* Panel — slides in from the left (RTL: left = start) */}
      <div className="flex h-full w-80 flex-col bg-white shadow-2xl">
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-slate-200 px-4 py-3"
          style={{ backgroundColor: "#1b335f" }}>
          <div className="flex items-center gap-2">
            <BookmarkIcon className="h-5 w-5" style={{ color: "#f4bf00" }} />
            <span className="font-semibold text-white">بنك الأسئلة</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-slate-100 px-3 py-2">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
            <SearchIcon className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في الأسئلة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")}>
                <XIcon className="h-3 w-3 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
        </div>

        {/* Type filter chips */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2">
          <button
            type="button"
            onClick={() => setSelectedType("")}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={
              !selectedType
                ? { backgroundColor: "#1b335f", color: "#fff" }
                : { backgroundColor: "#f1f5f9", color: "#64748b" }
            }>
            الكل
          </button>
          {questionTypes.map((qt) => (
            <button
              key={qt.id}
              type="button"
              onClick={() => setSelectedType(selectedType === qt.id ? "" : qt.id)}
              className="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={
                selectedType === qt.id
                  ? { backgroundColor: "#1b335f", color: "#fff" }
                  : { backgroundColor: "#f1f5f9", color: "#64748b" }
              }>
              {qt.label}
            </button>
          ))}
        </div>

        {/* Question list */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="h-7 w-7 animate-spin rounded-full border-b-2"
                style={{ borderColor: "#1b335f" }}
              />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookmarkIcon className="mb-3 h-10 w-10 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">
                {questions.length === 0 ? "البنك فارغ" : "لا توجد نتائج"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {questions.length === 0
                  ? "احفظ أسئلة من محرر الفورم لتظهر هنا"
                  : "جرّب تغيير كلمة البحث أو الفئة"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredQuestions.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-lg border border-slate-200 bg-white p-3 transition-all hover:border-slate-300 hover:shadow-sm">
                  <div className="flex items-start gap-2">
                    {/* Type icon */}
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: "#f0f4f8" }}>
                      {QUESTIONS_ICON_MAP[item.type]}
                    </div>

                    {/* Question text */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {getQuestionHeadline(item.questionData)}
                      </p>
                      {item.category && (
                        <span className="mt-0.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions — appear on hover */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      استُخدم {item.usageCount} {item.usageCount === 1 ? "مرة" : "مرات"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
                        <TrashIcon
                          className={`h-3.5 w-3.5 ${deletingId === item.id ? "animate-pulse" : ""}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestion(item)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white transition-colors"
                        style={{ backgroundColor: "#1b335f" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0f314c")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1b335f")}>
                        <PlusIcon className="h-3 w-3" />
                        إضافة
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer count */}
        <div className="border-t border-slate-100 px-4 py-2 text-center text-xs text-slate-400">
          {filteredQuestions.length} {filteredQuestions.length === 1 ? "سؤال" : "أسئلة"}
        </div>
      </div>
    </div>
  );
};
