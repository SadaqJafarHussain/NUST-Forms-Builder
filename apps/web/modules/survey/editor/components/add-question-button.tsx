"use client";

import { createId } from "@paralleldrive/cuid2";
import { Project } from "@prisma/client";
import { useTranslate } from "@tolgee/react";
import { BookmarkIcon, FileTextIcon, PlusCircleIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { TSurveyQuestion } from "@formbricks/types/surveys/types";
import { QuestionBankModal } from "@/modules/survey/editor/components/question-bank-modal";
import {
  getCXQuestionTypes,
  getQuestionDefaults,
  getQuestionTypes,
  universalQuestionPresets,
} from "@/modules/survey/lib/questions";

interface AddQuestionButtonProps {
  addQuestion: (question: any) => void;
  project: Project;
  isCxMode: boolean;
  environmentId: string;
  onImportFromForms?: () => void;
}

export const AddQuestionButton = ({
  addQuestion,
  project,
  isCxMode,
  environmentId,
  onImportFromForms,
}: AddQuestionButtonProps) => {
  const { t } = useTranslate();
  const [panelOpen, setPanelOpen] = useState(false);
  const [questionBankOpen, setQuestionBankOpen] = useState(false);

  const allTypes = isCxMode ? getCXQuestionTypes(t) : getQuestionTypes(t);

  const handleAdd = (typeId: string) => {
    addQuestion({
      ...universalQuestionPresets,
      ...getQuestionDefaults(typeId, project, t),
      id: createId(),
      type: typeId,
    });
    setPanelOpen(false);
  };

  const handleAddFromBank = (question: TSurveyQuestion) => {
    addQuestion(question);
  };

  return (
    <>
      <div className="mt-5" dir="rtl">
        {!panelOpen ? (
          /* Trigger button — simple "+ إضافة سؤال" */
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-500 transition-all hover:border-[#1b335f] hover:bg-slate-50 hover:text-[#1b335f]">
            <PlusCircleIcon className="h-5 w-5" />
            إضافة سؤال جديد
          </button>
        ) : (
          /* MS Forms-style question type picker panel */
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-700">إضافة سؤال جديد</h3>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            {/* ── Import sources — top section, visually distinct ── */}
            <div className="border-b border-slate-100 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-medium text-slate-400">استيراد من</p>
              <div className="flex gap-2">
                {/* Question bank */}
                <button
                  type="button"
                  onClick={() => {
                    setQuestionBankOpen(true);
                    setPanelOpen(false);
                  }}
                  className="flex flex-1 items-center gap-2.5 rounded-lg border-2 px-4 py-2.5 text-right text-sm font-medium transition-all hover:shadow-sm"
                  style={{ borderColor: "#f4bf00", backgroundColor: "#fffdf0", color: "#1b335f" }}>
                  <BookmarkIcon className="h-4 w-4 flex-shrink-0" style={{ color: "#f4bf00" }} />
                  <span>بنك الأسئلة</span>
                </button>
                {/* Import from saved forms */}
                <button
                  type="button"
                  onClick={() => {
                    if (onImportFromForms) {
                      onImportFromForms();
                      setPanelOpen(false);
                    }
                  }}
                  className="flex flex-1 items-center gap-2.5 rounded-lg border-2 px-4 py-2.5 text-right text-sm font-medium transition-all hover:shadow-sm"
                  style={{ borderColor: "#1b335f", backgroundColor: "#f0f4f8", color: "#1b335f" }}>
                  <FileTextIcon className="h-4 w-4 flex-shrink-0" style={{ color: "#1b335f" }} />
                  <span>نموذج آخر</span>
                </button>
              </div>
            </div>

            {/* ── Question type grid ── */}
            <div className="p-3">
              <p className="mb-2 text-xs font-medium text-slate-400">أو اختر نوع السؤال</p>
              <div className="grid grid-cols-3 gap-2">
                {allTypes.map((qt) => (
                  <button
                    key={qt.id}
                    type="button"
                    onClick={() => handleAdd(qt.id)}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-sm font-medium text-slate-700 transition-all hover:border-[#1b335f] hover:bg-white hover:text-[#1b335f] hover:shadow-sm">
                    <qt.icon className="h-5 w-5 flex-shrink-0" style={{ color: "#1b335f" }} />
                    <span className="flex-1 text-right">{qt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <QuestionBankModal
        open={questionBankOpen}
        setOpen={setQuestionBankOpen}
        environmentId={environmentId}
        onAddQuestion={handleAddFromBank}
      />
    </>
  );
};
