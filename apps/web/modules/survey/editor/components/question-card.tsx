"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Project } from "@prisma/client";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useTranslate } from "@tolgee/react";
import { CheckIcon, ChevronDownIcon, GripIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  TSurvey,
  TSurveyOpenTextQuestion,
  TSurveyQuestion,
  TSurveyQuestionId,
  TSurveyQuestionTypeEnum,
} from "@formbricks/types/surveys/types";
import { TUserLocale } from "@formbricks/types/user";
import { cn } from "@/lib/cn";
import { getLocalizedValue } from "@/lib/i18n/utils";
import { recallToHeadline } from "@/lib/utils/recall";
import { AddressQuestionForm } from "@/modules/survey/editor/components/address-question-form";
import { AdvancedSettings } from "@/modules/survey/editor/components/advanced-settings";
import { CalQuestionForm } from "@/modules/survey/editor/components/cal-question-form";
import { ConsentQuestionForm } from "@/modules/survey/editor/components/consent-question-form";
import { ContactInfoQuestionForm } from "@/modules/survey/editor/components/contact-info-question-form";
import { CTAQuestionForm } from "@/modules/survey/editor/components/cta-question-form";
import { DateQuestionForm } from "@/modules/survey/editor/components/date-question-form";
import { DropdownQuestionForm } from "@/modules/survey/editor/components/dropdown-question-form";
import { FileUploadQuestionForm } from "@/modules/survey/editor/components/file-upload-question-form";
import { IraqLocationQuestionForm } from "@/modules/survey/editor/components/iraq-location-question-form";
import { MatrixQuestionForm } from "@/modules/survey/editor/components/matrix-question-form";
import { MultipleChoiceQuestionForm } from "@/modules/survey/editor/components/multiple-choice-question-form";
import { NPSQuestionForm } from "@/modules/survey/editor/components/nps-question-form";
import { OpenQuestionForm } from "@/modules/survey/editor/components/open-question-form";
import { PictureSelectionForm } from "@/modules/survey/editor/components/picture-selection-form";
import {
  QuestionSuggestionStrip,
  SuggestionQuestion,
} from "@/modules/survey/editor/components/question-suggestion-strip";
import { RankingQuestionForm } from "@/modules/survey/editor/components/ranking-question-form";
import { RatingQuestionForm } from "@/modules/survey/editor/components/rating-question-form";
import { formatTextWithSlashes } from "@/modules/survey/editor/lib/utils";
import {
  getCXQuestionTypes,
  getQuestionDefaults,
  getQuestionTypes,
  getTSurveyQuestionTypeEnumName,
  universalQuestionPresets,
} from "@/modules/survey/lib/questions";

interface QuestionCardProps {
  localSurvey: TSurvey;
  project: Project;
  question: TSurveyQuestion;
  questionIdx: number;
  moveQuestion: (questionIndex: number, up: boolean) => void;
  updateQuestion: (questionIdx: number, updatedAttributes: any) => void;
  deleteQuestion: (questionIdx: number) => void;
  activeQuestionId: TSurveyQuestionId | null;
  setActiveQuestionId: (questionId: TSurveyQuestionId | null) => void;
  lastQuestion: boolean;
  selectedLanguageCode: string;
  setSelectedLanguageCode: (language: string) => void;
  isInvalid: boolean;
  addQuestion: (question: any, index?: number) => void;
  isFormbricksCloud: boolean;
  isCxMode: boolean;
  locale: TUserLocale;
  responseCount: number;
  isStorageConfigured: boolean;
  environmentId: string;
  suggestions: SuggestionQuestion[];
  onAlertTrigger?: () => void;
}

export const QuestionCard = ({
  localSurvey,
  project,
  question,
  questionIdx,
  moveQuestion: _moveQuestion,
  updateQuestion,
  deleteQuestion,
  activeQuestionId,
  setActiveQuestionId,
  lastQuestion,
  selectedLanguageCode,
  setSelectedLanguageCode,
  isInvalid,
  addQuestion,
  isFormbricksCloud,
  isCxMode,
  locale,
  responseCount: _responseCount,
  isStorageConfigured = true,
  environmentId: _environmentId,
  suggestions,
}: QuestionCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });
  const { t } = useTranslate();
  const open = activeQuestionId === question.id;
  const allTypes = isCxMode ? getCXQuestionTypes(t) : getQuestionTypes(t);

  const handleChangeType = (newTypeId: string) => {
    if (newTypeId === question.type) return;
    const newDefaults = getQuestionDefaults(newTypeId, project, t) ?? {};
    updateQuestion(questionIdx, {
      ...universalQuestionPresets,
      ...newDefaults,
      id: question.id,
      headline: question.headline,
      required: question.required,
      type: newTypeId,
      isDraft: question.isDraft,
    });
  };

  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
      }
    };
    if (typeDropdownOpen) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [typeDropdownOpen]);

  const currentType = allTypes.find((qt) => qt.id === question.type);

  // Strip is hidden after picking a suggestion; re-appears if user edits the headline.
  const [pickedHeadline, setPickedHeadline] = useState<string | null>(null);
  const currentHeadline = getLocalizedValue(question.headline, selectedLanguageCode) ?? "";
  const suggestionStripVisible =
    question.isDraft === true && !(pickedHeadline !== null && currentHeadline === pickedHeadline);

  const getIsRequiredToggleDisabled = (): boolean => {
    if (question.type === TSurveyQuestionTypeEnum.Address) {
      const allFieldsAreOptional = [
        question.addressLine1,
        question.addressLine2,
        question.city,
        question.state,
        question.zip,
        question.country,
      ]
        .filter((field) => field.show)
        .every((field) => !field.required);

      if (allFieldsAreOptional) {
        return true;
      }

      return [
        question.addressLine1,
        question.addressLine2,
        question.city,
        question.state,
        question.zip,
        question.country,
      ]
        .filter((field) => field.show)
        .some((condition) => condition.required === true);
    }

    if (question.type === TSurveyQuestionTypeEnum.ContactInfo) {
      const allFieldsAreOptional = [
        question.firstName,
        question.lastName,
        question.email,
        question.phone,
        question.company,
      ]
        .filter((field) => field.show)
        .every((field) => !field.required);

      if (allFieldsAreOptional) {
        return true;
      }

      return [question.firstName, question.lastName, question.email, question.phone, question.company]
        .filter((field) => field.show)
        .some((condition) => condition.required === true);
    }

    return false;
  };

  const handleRequiredToggle = () => {
    // Fix for NPS and Rating questions having missing translations when buttonLabel is not removed
    if (!question.required && (question.type === "nps" || question.type === "rating")) {
      updateQuestion(questionIdx, { required: true, buttonLabel: undefined });
    } else {
      updateQuestion(questionIdx, { required: !question.required });
    }
  };

  const style = {
    transition: transition ?? "transform 100ms ease",
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 10 : typeDropdownOpen ? 100 : 1,
  };

  return (
    <div
      className={cn("group w-full rounded-lg bg-white duration-200", open ? "shadow-md" : "shadow-sm")}
      ref={setNodeRef}
      style={{
        ...style,
        border: isInvalid ? "1px solid #f87171" : open ? "1px solid #1b335f" : "1px solid #dadce0",
        borderLeftWidth: open ? "4px" : undefined,
      }}
      id={question.id}>
      <Collapsible.Root
        open={open}
        onOpenChange={() => {
          if (activeQuestionId !== question.id) {
            setActiveQuestionId(question.id);
          } else {
            setActiveQuestionId(null);
          }
        }}
        className="w-full rounded-lg">
        <Collapsible.CollapsibleTrigger
          asChild
          className="flex cursor-pointer items-center justify-between gap-3 rounded-t-xl px-5 py-4 hover:bg-slate-50"
          aria-label="Toggle question details">
          <div>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                {...listeners}
                {...attributes}
                className="flex-shrink-0 cursor-grab text-slate-400 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}>
                <GripIcon className="h-4 w-4" />
              </div>
              <span className="flex-shrink-0 text-base font-medium text-slate-400">{questionIdx + 1}.</span>
              <div className="flex min-w-0 flex-1 flex-col" dir="auto">
                <h3 className="truncate text-base font-semibold text-slate-800">
                  {recallToHeadline(question.headline, localSurvey, true, selectedLanguageCode)[
                    selectedLanguageCode
                  ]
                    ? formatTextWithSlashes(
                        recallToHeadline(question.headline, localSurvey, true, selectedLanguageCode)[
                          selectedLanguageCode
                        ] ?? ""
                      )
                    : getTSurveyQuestionTypeEnumName(question.type, t)}
                </h3>
                {!open && (
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <span>{getTSurveyQuestionTypeEnumName(question.type, t)}</span>
                    <span>·</span>
                    <span>{question.required ? "إلزامي" : "اختياري"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Type selector — custom Google Forms-style dropdown */}
            <div
              ref={typeDropdownRef}
              className="relative mx-2 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setTypeDropdownOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50">
                {currentType?.icon && <currentType.icon className="h-4 w-4 flex-shrink-0 text-slate-500" />}
                <span className="max-w-[140px] truncate">{currentType?.label ?? question.type}</span>
                <ChevronDownIcon className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              </button>
              {typeDropdownOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-1 max-h-72 w-60 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
                  dir="rtl">
                  {allTypes.map((qt) => (
                    <button
                      key={qt.id}
                      type="button"
                      onClick={() => {
                        handleChangeType(qt.id);
                        setTypeDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50">
                      {qt.icon && <qt.icon className="h-4 w-4 flex-shrink-0 text-slate-500" />}
                      <span className="flex-1 text-right">{qt.label}</span>
                      {qt.id === question.type && (
                        <CheckIcon className="h-4 w-4 flex-shrink-0 text-[#1b335f]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Collapsible.CollapsibleTrigger>
        <Collapsible.CollapsibleContent className={`flex flex-col px-5 ${open && "pb-5"}`}>
          {/* Suggestion strip — only for new (draft) questions; hidden after picking until headline changes */}
          {open && suggestionStripVisible && (
            <div className="pt-3">
              <QuestionSuggestionStrip
                headline={currentHeadline}
                questionType={question.type}
                suggestions={suggestions}
                onSelect={(q) => {
                  setPickedHeadline(getLocalizedValue(q.headline, "default") ?? "");
                  updateQuestion(questionIdx, { ...q, id: question.id });
                }}
              />
            </div>
          )}
          {question.type === TSurveyQuestionTypeEnum.OpenText ? (
            <OpenQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              lastQuestion={lastQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.MultipleChoiceSingle ? (
            <MultipleChoiceQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              lastQuestion={lastQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.MultipleChoiceMulti ? (
            <MultipleChoiceQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              lastQuestion={lastQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.NPS ? (
            <NPSQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              lastQuestion={lastQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.CTA ? (
            <CTAQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              lastQuestion={lastQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.Rating ? (
            <RatingQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              lastQuestion={lastQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.Consent ? (
            <ConsentQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.Date ? (
            <DateQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.PictureSelection ? (
            <PictureSelectionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.FileUpload ? (
            <FileUploadQuestionForm
              localSurvey={localSurvey}
              project={project}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              isFormbricksCloud={isFormbricksCloud}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.Cal ? (
            <CalQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              lastQuestion={lastQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.Matrix ? (
            <MatrixQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.Address ? (
            <AddressQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.Ranking ? (
            <RankingQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              lastQuestion={lastQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.ContactInfo ? (
            <ContactInfoQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              lastQuestion={lastQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.IraqLocation ? (
            <IraqLocationQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : question.type === TSurveyQuestionTypeEnum.Dropdown ? (
            <DropdownQuestionForm
              localSurvey={localSurvey}
              question={question}
              questionIdx={questionIdx}
              updateQuestion={updateQuestion}
              lastQuestion={lastQuestion}
              selectedLanguageCode={selectedLanguageCode}
              setSelectedLanguageCode={setSelectedLanguageCode}
              isInvalid={isInvalid}
              locale={locale}
              isStorageConfigured={isStorageConfigured}
            />
          ) : null}
          {/* Unique field sub-options — only visible for openText questions when enabled */}
          {question.type === TSurveyQuestionTypeEnum.OpenText &&
            (question as TSurveyOpenTextQuestion & { uniqueField?: any }).uniqueField?.enabled && (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white" dir="rtl">
                {/* Panel header */}
                <div
                  className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5"
                  style={{ backgroundColor: "#f8faff" }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1b335f"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="text-xs font-semibold" style={{ color: "#1b335f" }}>
                    إعدادات الحقل الفريد
                  </span>
                </div>

                {/* Row 2 — Threshold (text input only, i.e. fuzzy matching) */}
                {(question as TSurveyOpenTextQuestion).inputType === "text" && (
                  <div className="border-b border-slate-100 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-700">حساسية التطابق</p>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: "#e8eef8", color: "#1b335f" }}>
                        {Math.round(((question as any).uniqueField?.threshold ?? 0.85) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={70}
                      max={99}
                      step={1}
                      value={Math.round(((question as any).uniqueField?.threshold ?? 0.85) * 100)}
                      onChange={(e) =>
                        updateQuestion(questionIdx, {
                          uniqueField: {
                            ...(question as any).uniqueField,
                            threshold: Number(e.target.value) / 100,
                          },
                        })
                      }
                      className="w-full accent-[#1b335f]"
                    />
                    <div className="mt-1 flex justify-between text-xs text-slate-400">
                      <span>متساهل (70%)</span>
                      <span>صارم (99%)</span>
                    </div>
                  </div>
                )}

                {/* Row 3 — Block on match */}
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700">عند اكتشاف تكرار</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {((question as any).uniqueField?.blockOnMatch ?? true)
                        ? "يُمنع الإرسال بالكامل"
                        : "يظهر تحذير ويُسمح بالإرسال"}
                    </p>
                  </div>
                  <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-200">
                    {(
                      [
                        { v: true, label: "حظر", color: "#dc2626" },
                        { v: false, label: "تحذير", color: "#d97706" },
                      ] as const
                    ).map(({ v, label, color }, i) => {
                      const active = ((question as any).uniqueField?.blockOnMatch ?? true) === v;
                      return (
                        <button
                          key={String(v)}
                          type="button"
                          onClick={() =>
                            updateQuestion(questionIdx, {
                              uniqueField: { ...(question as any).uniqueField, blockOnMatch: v },
                            })
                          }
                          className="px-3 py-1.5 text-xs font-medium transition"
                          style={{
                            backgroundColor: active ? color : "#fff",
                            color: active ? "#fff" : "#64748b",
                            borderRight: i === 0 ? "1px solid #e2e8f0" : "none",
                          }}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          <div className="mt-4 border-t border-slate-100 pt-4">
            <AdvancedSettings
              question={question}
              questionIdx={questionIdx}
              localSurvey={localSurvey}
              updateQuestion={updateQuestion}
              selectedLanguageCode={selectedLanguageCode}
            />
          </div>
        </Collapsible.CollapsibleContent>

        {/* Google Forms bottom bar: ⋮ | [مطلوب toggle] | 🗑 | ⎘  — exact layout match */}
        {open && (
          <div
            className="flex items-center border-t px-3 py-2"
            style={{ borderColor: "#e0e0e0", direction: "ltr" }}>
            {/* ⋮ more options (placeholder — can be extended) */}
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            <div className="mx-1 h-6 w-px bg-slate-200" />

            {/* [مطلوب toggle] */}
            <button
              type="button"
              disabled={getIsRequiredToggleDisabled()}
              onClick={(e) => {
                e.stopPropagation();
                handleRequiredToggle();
              }}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-slate-100 disabled:opacity-40">
              <span className="text-sm text-slate-600">مطلوب</span>
              <span
                className={`relative inline-flex h-5 w-10 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${question.required ? "bg-[#1b335f]" : "bg-slate-300"}`}>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${question.required ? "translate-x-5" : "translate-x-0"}`}
                />
              </span>
            </button>

            <div className="mx-1 h-6 w-px bg-slate-200" />

            {/* 🗑 delete */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteQuestion(questionIdx);
              }}
              title="حذف"
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-500">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>

            {/* ⎘ copy/duplicate */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addQuestion({ ...question, id: undefined as any }, questionIdx + 1);
              }}
              title="تكرار"
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>

            {/* Long answer toggle (open text only) — extra option after copy */}
            {question.type === "openText" && (
              <>
                <div className="mx-1 h-6 w-px bg-slate-200" />
                <button
                  type="button"
                  disabled={question.inputType !== "text"}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuestion(questionIdx, {
                      longAnswer: typeof question.longAnswer === "undefined" ? false : !question.longAnswer,
                    });
                  }}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-slate-100 disabled:opacity-40">
                  <span className="text-sm text-slate-600">إجابة طويلة</span>
                  <span
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${question.longAnswer !== false ? "bg-[#1b335f]" : "bg-slate-300"}`}>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${question.longAnswer !== false ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </span>
                </button>

                {/* Unique field toggle */}
                <div className="mx-1 h-6 w-px bg-slate-200" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const current = (question as any).uniqueField ?? {};
                    const inputType = (question as TSurveyOpenTextQuestion).inputType ?? "text";
                    const derivedMatchType =
                      inputType === "email" || inputType === "phone" ? "exact" : "fuzzy";
                    updateQuestion(questionIdx, {
                      uniqueField: {
                        enabled: !current.enabled,
                        matchType: derivedMatchType,
                        blockOnMatch: current.blockOnMatch ?? true,
                        threshold: current.threshold ?? 0.85,
                      },
                    });
                  }}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-slate-100">
                  <span className="text-sm text-slate-600">معرّف فريد</span>
                  <span
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${(question as any).uniqueField?.enabled ? "bg-[#f4bf00]" : "bg-slate-300"}`}>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${(question as any).uniqueField?.enabled ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </span>
                </button>
              </>
            )}
          </div>
        )}
      </Collapsible.Root>
    </div>
  );
};
