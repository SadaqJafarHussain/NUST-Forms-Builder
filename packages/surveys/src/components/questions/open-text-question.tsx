import { type RefObject } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { useTranslation } from "react-i18next";
import { type TResponseData, type TResponseTtc } from "@formbricks/types/responses";
import type { TSurveyOpenTextQuestion, TSurveyQuestionId } from "@formbricks/types/surveys/types";
import { BackButton } from "@/components/buttons/back-button";
import { SubmitButton } from "@/components/buttons/submit-button";
import { Headline } from "@/components/general/headline";
import { QuestionMedia } from "@/components/general/question-media";
import { Subheader } from "@/components/general/subheader";
import { ScrollableContainer } from "@/components/wrappers/scrollable-container";
import { getLocalizedValue } from "@/lib/i18n";
import { getUpdatedTtc, useTtc } from "@/lib/ttc";

// Iraq phone number pattern: starts with 07 followed by 9 digits (total 11 digits)
// Valid formats: 07XXXXXXXXX, +9647XXXXXXXXX, 009647XXXXXXXXX
const IRAQ_PHONE_PATTERN = /^(?:(?:\+|00)964|0)?7[0-9]{9}$/;

// Email validation pattern
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Number validation - allows integers and decimals
const NUMBER_PATTERN = /^-?\d*\.?\d+$/;

interface OpenTextQuestionProps {
  question: TSurveyOpenTextQuestion;
  value: string;
  onChange: (responseData: TResponseData) => void;
  onSubmit: (data: TResponseData, ttc: TResponseTtc) => void;
  onBack: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  autoFocus?: boolean;
  languageCode: string;
  ttc: TResponseTtc;
  setTtc: (ttc: TResponseTtc) => void;
  autoFocusEnabled: boolean;
  currentQuestionId: TSurveyQuestionId;
  isBackButtonHidden: boolean;
  dir?: "ltr" | "rtl" | "auto";
}

export function OpenTextQuestion({
  question,
  value,
  onChange,
  onSubmit,
  onBack,
  isFirstQuestion,
  isLastQuestion,
  languageCode,
  ttc,
  setTtc,
  autoFocusEnabled,
  currentQuestionId,
  isBackButtonHidden,
  dir = "auto",
}: Readonly<OpenTextQuestionProps>) {
  const [startTime, setStartTime] = useState(performance.now());
  const [currentLength, setCurrentLength] = useState(value.length || 0);
  const isMediaAvailable = question.imageUrl || question.videoUrl;
  const isCurrent = question.id === currentQuestionId;
  useTtc(question.id, ttc, setTtc, startTime, setStartTime, isCurrent);
  const { t } = useTranslation();

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isCurrent && autoFocusEnabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCurrent, autoFocusEnabled]);

  const handleInputChange = (inputValue: string) => {
    inputRef.current?.setCustomValidity("");
    setCurrentLength(inputValue.length);
    onChange({ [question.id]: inputValue });
  };

  const validateInput = (inputValue: string): string | null => {
    if (!inputValue || inputValue.trim() === "") {
      return question.required ? t("errors.please_fill_out_this_field") : null;
    }

    const trimmedValue = inputValue.trim();

    switch (question.inputType) {
      case "phone": {
        // Remove spaces, dashes for validation
        const cleanedPhone = trimmedValue.replace(/[\s-]/g, "");
        if (!IRAQ_PHONE_PATTERN.test(cleanedPhone)) {
          return t("errors.please_enter_a_valid_iraq_phone_number");
        }
        break;
      }
      case "email": {
        if (!EMAIL_PATTERN.test(trimmedValue)) {
          return t("errors.please_enter_a_valid_email");
        }
        break;
      }
      case "number": {
        if (!NUMBER_PATTERN.test(trimmedValue)) {
          return t("errors.please_enter_a_valid_number");
        }
        break;
      }
    }

    return null;
  };

  const handleOnSubmit = (e: Event) => {
    e.preventDefault();
    const input = inputRef.current;
    input?.setCustomValidity("");

    const validationError = validateInput(value);
    if (validationError) {
      input?.setCustomValidity(validationError);
      input?.reportValidity();
      return;
    }

    // at this point, validity is clean
    const updatedTtc = getUpdatedTtc(ttc, question.id, performance.now() - startTime);
    setTtc(updatedTtc);
    onSubmit({ [question.id]: value }, updatedTtc);
  };

  const computedDir = !value ? dir : "auto";

  return (
    <ScrollableContainer>
      <form key={question.id} onSubmit={handleOnSubmit} className="fb-w-full">
        {isMediaAvailable ? <QuestionMedia imgUrl={question.imageUrl} videoUrl={question.videoUrl} /> : null}
        <Headline
          headline={getLocalizedValue(question.headline, languageCode)}
          questionId={question.id}
          required={question.required}
        />
        <Subheader
          subheader={question.subheader ? getLocalizedValue(question.subheader, languageCode) : ""}
          questionId={question.id}
        />
        <div className="fb-mt-4">
          {question.longAnswer === false ? (
            <input
              ref={inputRef as RefObject<HTMLInputElement>}
              autoFocus={isCurrent ? autoFocusEnabled : undefined}
              tabIndex={isCurrent ? 0 : -1}
              name={question.id}
              id={question.id}
              placeholder={getLocalizedValue(question.placeholder, languageCode)}
              dir={computedDir}
              step="any"
              required={question.required}
              value={value ? value : ""}
              type={question.inputType === "phone" ? "tel" : question.inputType}
              onInput={(e) => {
                handleInputChange(e.currentTarget.value);
              }}
              className="fb-border-border placeholder:fb-text-placeholder fb-text-subheading focus:fb-border-brand fb-bg-input-bg fb-rounded-custom fb-block fb-w-full fb-border fb-p-2 fb-shadow-sm focus:fb-outline-none focus:fb-ring-0 sm:fb-text-sm"
              minLength={question.inputType === "text" ? question.charLimit?.min : undefined}
              maxLength={
                question.inputType === "text"
                  ? question.charLimit?.max
                  : question.inputType === "phone"
                    ? 15
                    : undefined
              }
            />
          ) : (
            <textarea
              ref={inputRef as RefObject<HTMLTextAreaElement>}
              rows={3}
              autoFocus={isCurrent ? autoFocusEnabled : undefined}
              name={question.id}
              tabIndex={isCurrent ? 0 : -1}
              aria-label="textarea"
              id={question.id}
              placeholder={getLocalizedValue(question.placeholder, languageCode, true)}
              dir={dir}
              required={question.required}
              value={value}
              onInput={(e) => {
                handleInputChange(e.currentTarget.value);
              }}
              className="fb-border-border placeholder:fb-text-placeholder fb-bg-input-bg fb-text-subheading focus:fb-border-brand fb-rounded-custom fb-block fb-w-full fb-border fb-p-2 fb-shadow-sm focus:fb-ring-0 sm:fb-text-sm"
              title={
                question.inputType === "phone" ? t("errors.please_enter_a_valid_phone_number") : undefined
              }
              minLength={question.inputType === "text" ? question.charLimit?.min : undefined}
              maxLength={question.inputType === "text" ? question.charLimit?.max : undefined}
            />
          )}
          {question.inputType === "text" && question.charLimit?.max !== undefined && (
            <span
              className={`fb-text-xs ${currentLength >= question.charLimit?.max ? "fb-text-red-500 font-semibold" : "text-neutral-400"}`}>
              {currentLength}/{question.charLimit?.max}
            </span>
          )}
        </div>
        <div className="fb-flex fb-flex-row-reverse fb-w-full fb-justify-between fb-pt-4">
          <SubmitButton
            tabIndex={isCurrent ? 0 : -1}
            buttonLabel={getLocalizedValue(question.buttonLabel, languageCode)}
            isLastQuestion={isLastQuestion}
            onClick={() => {}}
          />
          {!isFirstQuestion && !isBackButtonHidden && (
            <BackButton
              tabIndex={isCurrent ? 0 : -1}
              backButtonLabel={getLocalizedValue(question.backButtonLabel, languageCode)}
              onClick={() => {
                const updatedttc = getUpdatedTtc(ttc, question.id, performance.now() - startTime);
                setTtc(updatedttc);
                onBack();
              }}
            />
          )}
        </div>
      </form>
    </ScrollableContainer>
  );
}
