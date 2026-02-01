"use client";

import { createId } from "@paralleldrive/cuid2";
import { useTranslate } from "@tolgee/react";
import { BookmarkIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { TSurveyQuestion } from "@formbricks/types/surveys/types";
import { getLocalizedValue } from "@/lib/i18n/utils";
import { deleteFromQuestionBankAction, getQuestionsAction } from "@/lib/question-bank/actions";
import { getQuestionIconMap } from "@/modules/survey/lib/questions";
import { Button } from "@/modules/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/modules/ui/components/dialog";

interface QuestionBankItem {
  id: string;
  questionData: TSurveyQuestion;
  type: string;
  category: string | null;
  usageCount: number;
  createdAt: Date;
}

interface QuestionBankModalProps {
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
}: QuestionBankModalProps) => {
  const { t } = useTranslate();
  const QUESTIONS_ICON_MAP = getQuestionIconMap(t);
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getQuestionsAction({ environmentId });
      if (result?.data) {
        setQuestions(result.data);
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }, [environmentId, t]);

  useEffect(() => {
    if (open) {
      fetchQuestions();
    }
  }, [open, fetchQuestions]);

  const handleAddQuestion = (item: QuestionBankItem) => {
    // Create a new question with a new ID
    const newQuestion: TSurveyQuestion = {
      ...item.questionData,
      id: createId(),
    };
    onAddQuestion(newQuestion);
    toast.success(t("environments.surveys.edit.question_added_from_bank"));
    setOpen(false);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    setDeletingId(questionId);
    try {
      const result = await deleteFromQuestionBankAction({
        environmentId,
        questionId,
      });
      if (result?.data?.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        toast.success(t("environments.surveys.edit.question_deleted_from_bank"));
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setDeletingId(null);
    }
  };

  const getQuestionHeadline = (question: TSurveyQuestion): string => {
    const headline = getLocalizedValue(question.headline, "default");
    return headline || t("environments.surveys.edit.question");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkIcon className="h-5 w-5" />
            {t("environments.surveys.edit.question_bank")}
          </DialogTitle>
          <DialogDescription>
            {t("environments.surveys.edit.question_bank_empty_description")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-800" />
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookmarkIcon className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-lg font-medium text-slate-600">
                {t("environments.surveys.edit.question_bank_empty")}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {t("environments.surveys.edit.question_bank_empty_description")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      {QUESTIONS_ICON_MAP[item.type]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">
                        {getQuestionHeadline(item.questionData)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.category && <span className="mr-2">{item.category}</span>}
                        <span>
                          {t("environments.surveys.edit.used")} {item.usageCount}{" "}
                          {t("environments.surveys.edit.times")}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(item.id)}
                      disabled={deletingId === item.id}
                      className="text-slate-500 hover:text-red-600">
                      <TrashIcon className={`h-4 w-4 ${deletingId === item.id ? "animate-pulse" : ""}`} />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddQuestion(item)}
                      className="gap-1">
                      <PlusIcon className="h-4 w-4" />
                      {t("environments.surveys.edit.add_to_survey")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
