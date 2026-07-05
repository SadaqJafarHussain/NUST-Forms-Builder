import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { type TResponseData, type TResponseTtc } from "@formbricks/types/responses";
import type { TSurveyDropdownQuestion, TSurveyQuestionId } from "@formbricks/types/surveys/types";
import { BackButton } from "@/components/buttons/back-button";
import { SubmitButton } from "@/components/buttons/submit-button";
import { Headline } from "@/components/general/headline";
import { QuestionMedia } from "@/components/general/question-media";
import { Subheader } from "@/components/general/subheader";
import { ScrollableContainer } from "@/components/wrappers/scrollable-container";
import { getLocalizedValue } from "@/lib/i18n";
import { getUpdatedTtc, useTtc } from "@/lib/ttc";
import { cn, getShuffledChoicesIds } from "@/lib/utils";

interface DropdownQuestionProps {
  question: TSurveyDropdownQuestion;
  value?: string;
  onChange: (responseData: TResponseData) => void;
  onSubmit: (data: TResponseData, ttc: TResponseTtc) => void;
  onBack: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  languageCode: string;
  ttc: TResponseTtc;
  setTtc: (ttc: TResponseTtc) => void;
  autoFocusEnabled: boolean;
  currentQuestionId: TSurveyQuestionId;
  isBackButtonHidden: boolean;
  dir?: "ltr" | "rtl" | "auto";
}

export function DropdownQuestion({
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
}: Readonly<DropdownQuestionProps>) {
  const [startTime, setStartTime] = useState(performance.now());
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0, maxHeight: 240 });

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isCurrent = question.id === currentQuestionId;
  const isMediaAvailable = question.imageUrl || question.videoUrl;

  const shuffledChoicesIds = useMemo(() => {
    if (question.shuffleOption) {
      return getShuffledChoicesIds(question.choices, question.shuffleOption);
    }
    return question.choices.map((c) => c.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.shuffleOption, question.choices.length, question.choices[question.choices.length - 1].id]);

  const questionChoices = useMemo(() => {
    if (!question.choices.length) return [];
    if (question.shuffleOption === "none" || question.shuffleOption === undefined) return question.choices;
    return shuffledChoicesIds
      .map((id) => question.choices.find((c) => c.id === id))
      .filter(Boolean) as typeof question.choices;
  }, [question.choices, question.shuffleOption, shuffledChoicesIds]);

  useTtc(question.id, ttc, setTtc, startTime, setStartTime, isCurrent);

  const placeholder = getLocalizedValue(question.placeholder, languageCode) || "اختر من القائمة...";

  const filteredChoices = questionChoices.filter((c) =>
    getLocalizedValue(c.label, languageCode).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openMenu = () => {
    if (!buttonRef.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const spaceBelow = vh - r.bottom - 8;
    const spaceAbove = r.top - 8;
    const preferred = 240;
    let top: number;
    let maxHeight: number;
    if (spaceBelow >= preferred || spaceBelow >= spaceAbove) {
      top = r.bottom + 4;
      maxHeight = Math.min(preferred, spaceBelow);
    } else {
      maxHeight = Math.min(preferred, spaceAbove);
      top = r.top - maxHeight - 4;
    }
    setMenuStyle({ top, left: r.left, width: r.width, maxHeight });
    setIsOpen(true);
    setSearchTerm("");
  };

  const closeMenu = () => {
    setIsOpen(false);
    setSearchTerm("");
  };

  const selectChoice = (label: string) => {
    onChange({ [question.id]: label });
    closeMenu();
  };

  // Close on outside click / scroll
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };
    const closeOnScroll = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      closeMenu();
    };
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [isOpen]);

  return (
    <ScrollableContainer>
      <form
        key={question.id}
        onSubmit={(e) => {
          e.preventDefault();
          const updatedTtc = getUpdatedTtc(ttc, question.id, performance.now() - startTime);
          setTtc(updatedTtc);
          onSubmit({ [question.id]: value }, updatedTtc);
        }}
        className="fb-w-full">
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
          {/* Trigger button */}
          <button
            ref={buttonRef}
            type="button"
            tabIndex={isCurrent ? 0 : -1}
            autoFocus={autoFocusEnabled}
            onClick={() => (isOpen ? closeMenu() : openMenu())}
            className={cn(
              "fb-border fb-rounded-custom fb-bg-input-bg fb-text-heading fb-w-full fb-flex fb-items-center fb-justify-between fb-px-4 fb-py-3 fb-text-sm fb-transition",
              value ? "fb-border-brand" : "fb-border-border"
            )}
            style={{ direction: dir === "auto" ? "rtl" : dir }}>
            <span className={value ? "fb-text-heading" : "fb-text-placeholder"}>
              {value ? value : placeholder}
            </span>
            <svg
              className="fb-h-4 fb-w-4 fb-flex-shrink-0 fb-text-heading fb-opacity-50"
              style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu — fixed position to avoid overflow clipping */}
          {isOpen && (
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: menuStyle.top,
                left: menuStyle.left,
                width: menuStyle.width,
                maxHeight: menuStyle.maxHeight,
                zIndex: 9999,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                borderRadius: "0.5rem",
              }}
              className="fb-border fb-border-slate-200 fb-bg-white fb-shadow-xl">
              {/* Search */}
              <div className="fb-flex-shrink-0 fb-border-b fb-border-slate-100 fb-p-2">
                <input
                  autoFocus
                  type="text"
                  value={searchTerm}
                  onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
                  placeholder="ابحث..."
                  className="fb-w-full fb-rounded fb-border fb-border-slate-200 fb-px-3 fb-py-2 fb-text-sm fb-focus:outline-none"
                  style={{ direction: "rtl" }}
                />
              </div>
              {/* Options */}
              <div className="fb-flex-1 fb-overflow-y-auto fb-py-1">
                {filteredChoices.length > 0 ? (
                  filteredChoices.map((choice) => {
                    const label = getLocalizedValue(choice.label, languageCode);
                    const isSel = value === label;
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => selectChoice(label)}
                        className="fb-w-full fb-px-4 fb-py-2.5 fb-text-sm fb-transition hover:fb-bg-slate-50"
                        style={{
                          direction: dir === "auto" ? "rtl" : dir,
                          textAlign: dir === "ltr" ? "left" : "right",
                          color: isSel ? "var(--fb-brand, #1b335f)" : "#374151",
                          fontWeight: isSel ? 600 : 400,
                          backgroundColor: isSel ? "rgba(27,51,95,0.06)" : "transparent",
                        }}>
                        {label}
                      </button>
                    );
                  })
                ) : (
                  <p className="fb-px-4 fb-py-3 fb-text-center fb-text-sm fb-text-slate-400">لا توجد نتائج</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="fb-flex fb-flex-row-reverse fb-w-full fb-justify-between fb-pt-4">
          <SubmitButton
            tabIndex={isCurrent ? 0 : -1}
            buttonLabel={getLocalizedValue(question.buttonLabel, languageCode)}
            isLastQuestion={isLastQuestion}
          />
          {!isFirstQuestion && !isBackButtonHidden && (
            <BackButton
              backButtonLabel={getLocalizedValue(question.backButtonLabel, languageCode)}
              tabIndex={isCurrent ? 0 : -1}
              onClick={() => {
                const updatedTtc = getUpdatedTtc(ttc, question.id, performance.now() - startTime);
                setTtc(updatedTtc);
                onBack();
              }}
            />
          )}
        </div>
      </form>
    </ScrollableContainer>
  );
}
