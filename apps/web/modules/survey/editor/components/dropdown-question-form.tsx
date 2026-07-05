"use client";

import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { createId } from "@paralleldrive/cuid2";
import { GripVerticalIcon, PlusIcon, TrashIcon, UploadIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { TSurvey, TSurveyDropdownQuestion, TSurveyQuestionChoice } from "@formbricks/types/surveys/types";
import { TUserLocale } from "@formbricks/types/user";
import { cn } from "@/lib/cn";
import { createI18nString, extractLanguageCodes } from "@/lib/i18n/utils";
import { QuestionFormInput } from "@/modules/survey/components/question-form-input";
import { findOptionUsedInLogic } from "@/modules/survey/editor/lib/utils";
import { Button } from "@/modules/ui/components/button";
import { Label } from "@/modules/ui/components/label";

// ── Sortable choice row ───────────────────────────────────────────────────────

interface ChoiceRowProps {
  choice: TSurveyQuestionChoice;
  choiceIdx: number;
  onChange: (label: string) => void;
  onDelete: () => void;
  onAdd: () => void;
  isInvalid: boolean;
  selectedLanguageCode: string;
  isOnly: boolean;
}

const ChoiceRow = ({
  choice,
  choiceIdx,
  onChange,
  onDelete,
  onAdd,
  isInvalid,
  selectedLanguageCode,
  isOnly,
}: ChoiceRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: choice.id,
  });

  const labelVal =
    typeof choice.label === "string"
      ? choice.label
      : (choice.label[selectedLanguageCode] ?? choice.label["default"] ?? "");

  const isEmpty = isInvalid && labelVal.trim() === "";

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition: transition ?? undefined,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.6 : 1,
      }}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-white px-3 py-2",
        isEmpty ? "border-red-400" : "border-slate-200"
      )}>
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab text-slate-300 hover:text-slate-500">
        <GripVerticalIcon className="h-4 w-4" />
      </button>

      {/* Number badge */}
      <span
        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: "#1b335f" }}>
        {choiceIdx + 1}
      </span>

      {/* Label input */}
      <input
        type="text"
        value={labelVal}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`الخيار ${choiceIdx + 1}`}
        dir="rtl"
        className="flex-1 border-0 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
      />

      {/* Add below */}
      <button
        type="button"
        onClick={onAdd}
        title="إضافة خيار أدناه"
        className="flex-shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
        <PlusIcon className="h-3.5 w-3.5" />
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        disabled={isOnly}
        title="حذف الخيار"
        className="flex-shrink-0 rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30">
        <TrashIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

// ── Main form ─────────────────────────────────────────────────────────────────

interface DropdownQuestionFormProps {
  localSurvey: TSurvey;
  question: TSurveyDropdownQuestion;
  questionIdx: number;
  updateQuestion: (questionIdx: number, updatedAttributes: Partial<TSurveyDropdownQuestion>) => void;
  lastQuestion: boolean;
  selectedLanguageCode: string;
  setSelectedLanguageCode: (language: string) => void;
  isInvalid: boolean;
  locale: TUserLocale;
  isStorageConfigured: boolean;
}

export const DropdownQuestionForm = ({
  question,
  questionIdx,
  updateQuestion,
  isInvalid,
  localSurvey,
  selectedLanguageCode,
  setSelectedLanguageCode,
  locale,
  isStorageConfigured,
}: DropdownQuestionFormProps) => {
  const surveyLanguageCodes = extractLanguageCodes(localSurvey.languages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const questionRef = useRef<HTMLInputElement>(null);
  const [isNew, setIsNew] = useState(true);

  const [parent] = useAutoAnimate();

  useEffect(() => {
    if (isNew && questionRef.current) questionRef.current.focus();
  }, [isNew]);

  // ── Choice helpers ──────────────────────────────────────────────────────────

  const updateChoiceLabel = (choiceIdx: number, label: string) => {
    const newChoices = question.choices.map((c, i) =>
      i === choiceIdx ? { ...c, label: createI18nString(label, surveyLanguageCodes) } : c
    );
    updateQuestion(questionIdx, { choices: newChoices });
  };

  const addChoiceAt = (afterIdx?: number) => {
    setIsNew(false);
    const newChoice: TSurveyQuestionChoice = {
      id: createId(),
      label: createI18nString("", surveyLanguageCodes),
    };
    const newChoices = [...question.choices];
    if (afterIdx !== undefined) {
      newChoices.splice(afterIdx + 1, 0, newChoice);
    } else {
      newChoices.push(newChoice);
    }
    updateQuestion(questionIdx, { choices: newChoices });
  };

  const deleteChoice = (choiceIdx: number) => {
    if (question.choices.length <= 2) {
      toast.error("القائمة المنسدلة تحتاج خيارين على الأقل");
      return;
    }
    const choiceId = question.choices[choiceIdx].id;
    const usedInLogicAt = findOptionUsedInLogic(localSurvey, question.id, choiceId);
    if (usedInLogicAt !== -1) {
      toast.error(`هذا الخيار مُستخدم في المنطق الشرطي للسؤال ${usedInLogicAt + 1}`);
      return;
    }
    updateQuestion(questionIdx, {
      choices: question.choices.filter((_, i) => i !== choiceIdx),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = question.choices.findIndex((c) => c.id === active.id);
    const newIdx = question.choices.findIndex((c) => c.id === over.id);
    const newChoices = [...question.choices];
    newChoices.splice(oldIdx, 1);
    newChoices.splice(newIdx, 0, question.choices[oldIdx]);
    updateQuestion(questionIdx, { choices: newChoices });
  };

  // ── Excel import ────────────────────────────────────────────────────────────

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];

        // Read all rows, grab first column value from each non-empty row
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const labels: string[] = rows.map((row) => String(row[0] ?? "").trim()).filter((v) => v.length > 0);

        if (labels.length < 2) {
          toast.error("الملف يجب أن يحتوي على خيارين على الأقل في العمود الأول");
          return;
        }
        if (labels.length > 200) {
          toast.error("الحد الأقصى هو 200 خيار");
          return;
        }

        const newChoices: TSurveyQuestionChoice[] = labels.map((label) => ({
          id: createId(),
          label: createI18nString(label, surveyLanguageCodes),
        }));
        updateQuestion(questionIdx, { choices: newChoices });
        toast.success(`تم استيراد ${newChoices.length} خيار بنجاح`);
      } catch {
        toast.error("تعذّر قراءة الملف، تأكد أن الصيغة xlsx أو xls");
      } finally {
        // reset so same file can be re-imported
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Placeholder value helper ────────────────────────────────────────────────
  const placeholderVal =
    typeof question.placeholder === "object"
      ? (question.placeholder[selectedLanguageCode] ?? question.placeholder["default"] ?? "")
      : (question.placeholder ?? "");

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form dir="rtl">
      {/* Question headline */}
      <QuestionFormInput
        id="headline"
        value={question.headline}
        label="نص السؤال *"
        localSurvey={localSurvey}
        questionIdx={questionIdx}
        isInvalid={isInvalid}
        updateQuestion={updateQuestion}
        selectedLanguageCode={selectedLanguageCode}
        setSelectedLanguageCode={setSelectedLanguageCode}
        locale={locale}
        isStorageConfigured={isStorageConfigured}
      />

      {/* Optional description */}
      <div ref={parent}>
        {question.subheader !== undefined && (
          <div className="mt-3">
            <QuestionFormInput
              id="subheader"
              value={question.subheader}
              label="وصف (اختياري)"
              localSurvey={localSurvey}
              questionIdx={questionIdx}
              isInvalid={isInvalid}
              updateQuestion={updateQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          </div>
        )}
        {question.subheader === undefined && (
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            type="button"
            onClick={() =>
              updateQuestion(questionIdx, {
                subheader: createI18nString("", surveyLanguageCodes),
              })
            }>
            <PlusIcon className="mr-1 h-4 w-4" />
            إضافة وصف
          </Button>
        )}
      </div>

      {/* Placeholder text */}
      <div className="mt-4">
        <Label className="mb-1 block text-xs text-slate-600">نص التلميح (Placeholder)</Label>
        <input
          type="text"
          value={placeholderVal}
          dir="rtl"
          placeholder="اختر من القائمة..."
          onChange={(e) =>
            updateQuestion(questionIdx, {
              placeholder: createI18nString(e.target.value, surveyLanguageCodes),
            })
          }
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-[#1b335f] focus:outline-none"
        />
      </div>

      {/* Choices section */}
      <div className="mt-5">
        {/* Header row */}
        <div className="mb-2 flex items-center justify-between">
          <Label className="text-xs text-slate-600">خيارات القائمة *</Label>
          {/* Excel import */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleExcelImport}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-[#1b335f] hover:text-[#1b335f]"
              title="استيراد خيارات من ملف Excel (العمود الأول = أسماء الخيارات)">
              <UploadIcon className="h-3.5 w-3.5" />
              استيراد من Excel
            </button>
          </div>
        </div>

        {/* Excel format hint */}
        <p className="mb-3 text-xs text-slate-400">
          💡 صيغة Excel: ضع أسماء الخيارات في العمود الأول (A) بدون رأس، كل خيار في سطر.
        </p>

        {/* Drag-and-drop list */}
        <DndContext id="dropdown-choices" onDragEnd={handleDragEnd}>
          <SortableContext items={question.choices} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2" ref={parent}>
              {question.choices.map((choice, choiceIdx) => (
                <ChoiceRow
                  key={choice.id}
                  choice={choice}
                  choiceIdx={choiceIdx}
                  selectedLanguageCode={selectedLanguageCode}
                  isInvalid={isInvalid}
                  isOnly={question.choices.length <= 2}
                  onChange={(label) => updateChoiceLabel(choiceIdx, label)}
                  onDelete={() => deleteChoice(choiceIdx)}
                  onAdd={() => addChoiceAt(choiceIdx)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add choice button */}
        <button
          type="button"
          onClick={() => addChoiceAt()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-2.5 text-sm font-medium text-slate-400 transition hover:border-[#1b335f] hover:text-[#1b335f]">
          <PlusIcon className="h-4 w-4" />
          إضافة خيار جديد
        </button>

        {/* Shuffle option */}
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <Label className="flex-1 text-sm text-slate-600">ترتيب الخيارات</Label>
          <select
            value={question.shuffleOption ?? "none"}
            onChange={(e) => updateQuestion(questionIdx, { shuffleOption: e.target.value as any })}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-[#1b335f] focus:outline-none">
            <option value="none">الترتيب الحالي</option>
            <option value="all">عشوائي بالكامل</option>
            <option value="exceptLast">عشوائي (عدا الأخير)</option>
          </select>
        </div>
      </div>

      {/* Current choices count */}
      <p className="mt-3 text-xs text-slate-400">{question.choices.length} خيار في القائمة</p>
    </form>
  );
};
