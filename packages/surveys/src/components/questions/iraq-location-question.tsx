import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { TResponseData, TResponseTtc } from "@formbricks/types/responses";
import type { TSurveyIraqLocationQuestion, TSurveyQuestionId } from "@formbricks/types/surveys/types";
import { BackButton } from "@/components/buttons/back-button";
import { SubmitButton } from "@/components/buttons/submit-button";
import { Headline } from "@/components/general/headline";
import { QuestionMedia } from "@/components/general/question-media";
import { Subheader } from "@/components/general/subheader";
import { ScrollableContainer } from "@/components/wrappers/scrollable-container";
import { getLocalizedValue } from "@/lib/i18n";
import { getUpdatedTtc, useTtc } from "@/lib/ttc";
import { cn } from "@/lib/utils";
// Import your actual JSON data
import iraqLocationData from "../../lib/iraqLocationData.json";

interface IraqLocationQuestionProps {
  question: TSurveyIraqLocationQuestion;
  value?: string;
  onChange: (responseData: TResponseData) => void;
  onSubmit: (data: TResponseData, ttc: TResponseTtc) => void;
  onBack: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  languageCode: string;
  ttc: TResponseTtc;
  setTtc: (ttc: TResponseTtc) => void;
  currentQuestionId: TSurveyQuestionId;
  autoFocusEnabled: boolean;
  isBackButtonHidden: boolean;
  dir?: "ltr" | "rtl" | "auto";
}

interface DropdownProps {
  options: any[];
  selected: any;
  onSelect: (item: any) => void;
  placeholder: string;
  getDisplayName: (item: any) => string;
  searchPlaceholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  tabIndex?: number;
  dir?: "ltr" | "rtl" | "auto";
}

const SearchableDropdown = ({
  options,
  selected,
  onSelect,
  placeholder,
  getDisplayName,
  searchPlaceholder = "Search...",
  disabled = false,
  autoFocus = false,
  tabIndex = 0,
  dir = "auto",
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const filteredOptions = options.filter((option) =>
    getDisplayName(option).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: any) => {
    onSelect(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  // Auto-focus the button when autoFocus is true
  useEffect(() => {
    if (autoFocus && buttonRef.current && !disabled) {
      buttonRef.current.focus();
    }
  }, [autoFocus, disabled]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="fb-relative fb-w-full">
      {/* Selected value display */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        tabIndex={tabIndex}
        dir={dir}
        className={cn(
          "fb-border-border fb-text-subheading fb-bg-input-bg fb-rounded-custom fb-block fb-w-full fb-border fb-p-2 fb-shadow-sm fb-outline-none fb-ring-offset-1 focus:fb-ring-2 focus:fb-ring-offset-2",
          "fb-text-left fb-relative",
          disabled ? "fb-opacity-50 fb-cursor-not-allowed fb-bg-input-disabled-bg" : "fb-cursor-pointer",
          !selected ? "fb-text-placeholder" : ""
        )}>
        {selected ? getDisplayName(selected) : placeholder}
        <span className="fb-absolute fb-inset-y-0 fb-right-0 fb-flex fb-items-center fb-pr-2 fb-pointer-events-none">
          <svg
            className="fb-h-5 fb-w-5 fb-text-subheading"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="fb-absolute fb-z-10 fb-w-full fb-mt-1 fb-bg-input-bg fb-border fb-border-border fb-rounded-custom fb-shadow-lg fb-max-h-60 fb-overflow-auto">
          {/* Search input */}
          <div className="fb-p-2 fb-border-b fb-border-border">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
              dir={dir}
              className="fb-border-border fb-bg-input-bg fb-text-subheading fb-rounded-custom fb-w-full fb-p-2 fb-border fb-shadow-sm fb-outline-none focus:fb-ring-2 focus:fb-ring-offset-2"
              autoFocus
            />
          </div>

          {/* Options list */}
          <div className="fb-py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.province_id || option.district_ID || option.Neighbor_ID}
                  type="button"
                  onClick={() => handleSelect(option)}
                  dir={dir}
                  className={cn(
                    "fb-w-full fb-text-left fb-px-4 fb-py-2 fb-text-sm fb-text-subheading hover:fb-bg-accent-bg focus:fb-bg-accent-bg focus:fb-outline-none",
                    selected &&
                      ((option.province_id && selected.province_id === option.province_id) ||
                        (option.district_ID && selected.district_ID === option.district_ID) ||
                        (option.Neighbor_ID && selected.Neighbor_ID === option.Neighbor_ID))
                      ? "fb-bg-accent-bg fb-font-medium"
                      : ""
                  )}>
                  {getDisplayName(option)}
                </button>
              ))
            ) : (
              <div className="fb-px-4 fb-py-2 fb-text-sm fb-text-placeholder">لا توجد نتائج</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export function IraqLocationQuestion({
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
  currentQuestionId,
  autoFocusEnabled,
  isBackButtonHidden,
  dir = "auto",
}: Readonly<IraqLocationQuestionProps>) {
  const [startTime, setStartTime] = useState(performance.now());
  const isMediaAvailable = question.imageUrl || question.videoUrl;
  const formRef = useRef<HTMLFormElement>(null);
  useTtc(question.id, ttc, setTtc, startTime, setStartTime, question.id === currentQuestionId);

  const [selectedProvince, setSelectedProvince] = useState<any>(null);
  const [selectedJudiciary, setSelectedJudiciary] = useState<any>(null);
  const [selectedArea, setSelectedArea] = useState<any>(null);

  const isCurrent = question.id === currentQuestionId;

  // For Iraq Location question, we always show Arabic location data
  // since this is specifically designed for Iraq
  // The languageCode might be "default" even for Arabic surveys
  const isArabic = true; // Always use Arabic for Iraq location data

  // Initialize from existing value if present
  useEffect(() => {
    if (value) {
      try {
        const parsedValue = JSON.parse(value);
        if (parsedValue.province && parsedValue.province.id) {
          const province = iraqLocationData.provinces.find((p) => p.province_id === parsedValue.province.id);
          if (province) {
            setSelectedProvince(province);

            if (parsedValue.judiciary && parsedValue.judiciary.id) {
              const judiciary = iraqLocationData.judiciaries.find(
                (j) => j.district_ID === parsedValue.judiciary.id && j.province_id === province.province_id
              );
              if (judiciary) {
                setSelectedJudiciary(judiciary);

                if (parsedValue.area && parsedValue.area.id) {
                  const area = iraqLocationData.areas.find(
                    (a) =>
                      a.Neighbor_ID === parsedValue.area.id &&
                      a.province_id === province.province_id &&
                      a.district_ID === judiciary.district_ID
                  );
                  if (area) setSelectedArea(area);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error parsing stored value:", error);
      }
    }
  }, [value]);

  // Filter out "none" entries (where id = 0)
  const provinces = useMemo(() => {
    return iraqLocationData.provinces.filter((province) => province.province_id !== 0);
  }, []);

  const judiciaries = useMemo(() => {
    if (!selectedProvince) return [];
    return iraqLocationData.judiciaries.filter(
      (j) => j.province_id === selectedProvince.province_id && j.district_ID !== 0
    );
  }, [selectedProvince]);

  const areas = useMemo(() => {
    if (!selectedProvince || !selectedJudiciary) return [];
    return iraqLocationData.areas.filter(
      (a) =>
        a.province_id === selectedProvince.province_id &&
        a.district_ID === selectedJudiciary.district_ID &&
        a.Neighbor_ID !== 0
    );
  }, [selectedProvince, selectedJudiciary]);

  const handleProvinceChange = (province: any) => {
    setSelectedProvince(province);
    setSelectedJudiciary(null);
    setSelectedArea(null);
    updateResponseData(province, null, null);
  };

  const handleJudiciaryChange = (judiciary: any) => {
    setSelectedJudiciary(judiciary);
    setSelectedArea(null);
    updateResponseData(selectedProvince, judiciary, null);
  };

  const handleAreaChange = (area: any) => {
    setSelectedArea(area);
    updateResponseData(selectedProvince, selectedJudiciary, area);
  };

  // Separate display functions for each type to avoid field name conflicts
  // Areas have a 'province' field that contains Arabic province name, not the area name!
  const getProvinceDisplayName = (item: any) => {
    if (!item) return "";
    return isArabic ? item["المحافظة"] : item.province;
  };

  const getJudiciaryDisplayName = (item: any) => {
    if (!item) return "";
    return isArabic ? item["المدينة او القضاء"] : item["The city or The judiciary "];
  };

  const getAreaDisplayName = (item: any) => {
    if (!item) return "";
    return isArabic ? item["المنطقة او الحي"] : item["The Area or The Neighborhood"];
  };

  const updateResponseData = (province: any, judiciary: any, area: any) => {
    if (!province) {
      onChange({ [question.id]: "" });
      return;
    }

    const responseValue = JSON.stringify({
      province: {
        id: province.province_id,
        name: isArabic ? province["المحافظة"] : province.province,
        isOther: false,
      },
      judiciary: judiciary
        ? {
            id: judiciary.district_ID,
            name: isArabic ? judiciary["المدينة او القضاء"] : judiciary["The city or The judiciary "],
            isOther: false,
          }
        : null,
      area: area
        ? {
            id: area.Neighbor_ID,
            name: isArabic ? area["المنطقة او الحي"] : area["The Area or The Neighborhood"],
            isOther: false,
          }
        : null,
    });

    onChange({ [question.id]: responseValue });
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    if (!selectedProvince || !selectedJudiciary || !selectedArea) return;

    const updatedTtc = getUpdatedTtc(ttc, question.id, performance.now() - startTime);
    setTtc(updatedTtc);

    const responseValue = JSON.stringify({
      province: {
        id: selectedProvince.province_id,
        name: isArabic ? selectedProvince["المحافظة"] : selectedProvince.province,
        isOther: false,
      },
      judiciary: {
        id: selectedJudiciary.district_ID,
        name: isArabic
          ? selectedJudiciary["المدينة او القضاء"]
          : selectedJudiciary["The city or The judiciary "],
        isOther: false,
      },
      area: {
        id: selectedArea.Neighbor_ID,
        name: isArabic ? selectedArea["المنطقة او الحي"] : selectedArea["The Area or The Neighborhood"],
        isOther: false,
      },
    });

    onSubmit({ [question.id]: responseValue }, updatedTtc);
  };

  const isValid = selectedProvince && selectedJudiciary && selectedArea;

  return (
    <ScrollableContainer>
      <form key={question.id} onSubmit={handleSubmit} className="fb-w-full" ref={formRef}>
        <div>
          {isMediaAvailable ? (
            <QuestionMedia imgUrl={question.imageUrl} videoUrl={question.videoUrl} />
          ) : null}
          <Headline
            headline={getLocalizedValue(question.headline, languageCode)}
            questionId={question.id}
            required={question.required}
          />
          <Subheader
            subheader={question.subheader ? getLocalizedValue(question.subheader, languageCode) : ""}
            questionId={question.id}
          />

          <div className="fb-flex fb-flex-col fb-space-y-4 fb-mt-4 fb-w-full">
            {/* Province Selection */}
            <div className="fb-space-y-1">
              <label className="fb-text-subheading fb-text-sm fb-font-medium">
                {getLocalizedValue(question.province.label, languageCode) || "المحافظة"}
                {question.province.required && <span className="fb-text-red-500 fb-ml-1">*</span>}
              </label>
              <SearchableDropdown
                options={provinces}
                selected={selectedProvince}
                onSelect={handleProvinceChange}
                placeholder={
                  getLocalizedValue(question.province.placeholder, languageCode) || "اختر المحافظة"
                }
                getDisplayName={getProvinceDisplayName}
                searchPlaceholder="ابحث عن المحافظة..."
                autoFocus={autoFocusEnabled && isCurrent}
                tabIndex={isCurrent ? 0 : -1}
                dir={dir}
              />
            </div>

            {/* Judiciary Selection */}
            <div className="fb-space-y-1">
              <label className="fb-text-subheading fb-text-sm fb-font-medium">
                {getLocalizedValue(question.judiciary.label, languageCode) || "القضاء"}
                {question.judiciary.required && <span className="fb-text-red-500 fb-ml-1">*</span>}
              </label>
              <SearchableDropdown
                options={judiciaries}
                selected={selectedJudiciary}
                onSelect={handleJudiciaryChange}
                placeholder={getLocalizedValue(question.judiciary.placeholder, languageCode) || "اختر القضاء"}
                getDisplayName={getJudiciaryDisplayName}
                searchPlaceholder="ابحث عن القضاء..."
                disabled={!selectedProvince}
                tabIndex={isCurrent ? 0 : -1}
                dir={dir}
              />
              {!selectedProvince && (
                <p className="fb-mt-1 fb-text-xs fb-text-placeholder">يجب اختيار المحافظة أولاً</p>
              )}
            </div>

            {/* Area Selection */}
            <div className="fb-space-y-1">
              <label className="fb-text-subheading fb-text-sm fb-font-medium">
                {getLocalizedValue(question.area.label, languageCode) || "المنطقة"}
                {question.area.required && <span className="fb-text-red-500 fb-ml-1">*</span>}
              </label>
              <SearchableDropdown
                options={areas}
                selected={selectedArea}
                onSelect={handleAreaChange}
                placeholder={getLocalizedValue(question.area.placeholder, languageCode) || "اختر المنطقة"}
                getDisplayName={getAreaDisplayName}
                searchPlaceholder="ابحث عن المنطقة..."
                disabled={!selectedJudiciary}
                tabIndex={isCurrent ? 0 : -1}
                dir={dir}
              />
              {!selectedJudiciary && (
                <p className="fb-mt-1 fb-text-xs fb-text-placeholder">يجب اختيار القضاء أولاً</p>
              )}
            </div>
          </div>

          <div className="fb-flex fb-flex-row-reverse fb-w-full fb-justify-between fb-pt-4">
            <SubmitButton
              tabIndex={isCurrent ? 0 : -1}
              buttonLabel={getLocalizedValue(question.buttonLabel, languageCode)}
              isLastQuestion={isLastQuestion}
              disabled={!isValid}
            />
            <div />
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
        </div>
      </form>
    </ScrollableContainer>
  );
}
