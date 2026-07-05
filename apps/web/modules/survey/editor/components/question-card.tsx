"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Project } from "@prisma/client";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useTranslate } from "@tolgee/react";
import { GripIcon } from "lucide-react";
import { useState } from "react";
import {
  TSurvey,
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
import { EditorCardMenu } from "@/modules/survey/editor/components/editor-card-menu";
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
import { getTSurveyQuestionTypeEnumName } from "@/modules/survey/lib/questions";
import { Alert, AlertButton, AlertTitle } from "@/modules/ui/components/alert";
import { Label } from "@/modules/ui/components/label";
import { Switch } from "@/modules/ui/components/switch";

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
  onAlertTrigger: () => void;
  isStorageConfigured: boolean;
  environmentId: string;
  suggestions: SuggestionQuestion[];
}

export const QuestionCard = ({
  localSurvey,
  project,
  question,
  questionIdx,
  moveQuestion,
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
  responseCount,
  onAlertTrigger,
  isStorageConfigured = true,
  environmentId,
  suggestions,
}: QuestionCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });
  const { t } = useTranslate();
  const open = activeQuestionId === question.id;

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
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      className={cn(
        "group w-full rounded-xl bg-white duration-200",
        open ? "shadow-md" : "shadow-sm hover:shadow-md"
      )}
      ref={setNodeRef}
      style={{
        ...style,
        borderTop: isInvalid ? "1px solid #f87171" : open ? "1px solid #d1d5db" : "1px solid #e5e7eb",
        borderRight: isInvalid ? "1px solid #f87171" : open ? "1px solid #d1d5db" : "1px solid #e5e7eb",
        borderBottom: isInvalid ? "1px solid #f87171" : open ? "1px solid #d1d5db" : "1px solid #e5e7eb",
        borderLeft: open ? "4px solid #1b335f" : isInvalid ? "1px solid #f87171" : "1px solid #e5e7eb",
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

            <div className="flex flex-shrink-0 items-center">
              <EditorCardMenu
                survey={localSurvey}
                cardIdx={questionIdx}
                lastCard={lastQuestion}
                deleteCard={deleteQuestion}
                moveCard={moveQuestion}
                card={question}
                project={project}
                updateCard={updateQuestion}
                addCard={addQuestion}
                cardType="question"
                isCxMode={isCxMode}
                environmentId={environmentId}
              />
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
          {responseCount > 0 &&
          [
            TSurveyQuestionTypeEnum.MultipleChoiceSingle,
            TSurveyQuestionTypeEnum.MultipleChoiceMulti,
            TSurveyQuestionTypeEnum.PictureSelection,
            TSurveyQuestionTypeEnum.Rating,
            TSurveyQuestionTypeEnum.NPS,
            TSurveyQuestionTypeEnum.Ranking,
            TSurveyQuestionTypeEnum.Matrix,
            TSurveyQuestionTypeEnum.Dropdown,
          ].includes(question.type) ? (
            <Alert variant="warning" size="small" className="w-fill" role="alert">
              <AlertTitle>{t("environments.surveys.edit.caution_text")}</AlertTitle>
              <AlertButton onClick={() => onAlertTrigger()}>{t("common.learn_more")}</AlertButton>
            </Alert>
          ) : null}
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

        {open && (
          <div className="mx-5 flex justify-end gap-6 border-t border-slate-100" dir="rtl">
            {question.type === "openText" && (
              <div className="my-4 flex items-center gap-2">
                <Label htmlFor="longAnswer">إجابة طويلة</Label>
                <Switch
                  id="longAnswer"
                  disabled={question.inputType !== "text"}
                  checked={question.longAnswer !== false}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuestion(questionIdx, {
                      longAnswer: typeof question.longAnswer === "undefined" ? false : !question.longAnswer,
                    });
                  }}
                />
              </div>
            )}
            <div className="my-4 flex items-center gap-2">
              <Label htmlFor="required-toggle">{question.required ? "إلزامي" : "اختياري"}</Label>
              <Switch
                id="required-toggle"
                checked={question.required}
                disabled={getIsRequiredToggleDisabled()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRequiredToggle();
                }}
              />
            </div>
          </div>
        )}
      </Collapsible.Root>
    </div>
  );
};
