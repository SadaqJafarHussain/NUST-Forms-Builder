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

// Dropdown that uses position:fixed so it is never clipped by overflow:auto parents
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
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  }>({ top: 0, left: 0, width: 0, maxHeight: 240 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const filteredOptions = options.filter((option) =>
    getDisplayName(option).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpen = () => {
    if (disabled) return;
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const spaceBelow = vh - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const preferred = 240;

      let top: number;
      let maxHeight: number;
      if (spaceBelow >= preferred || spaceBelow >= spaceAbove) {
        // open downward
        top = rect.bottom + 4;
        maxHeight = Math.min(preferred, spaceBelow);
      } else {
        // flip upward
        maxHeight = Math.min(preferred, spaceAbove);
        top = rect.top - maxHeight - 4;
      }
      setMenuStyle({ top, left: rect.left, width: rect.width, maxHeight });
    }
    setIsOpen(!isOpen);
  };

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

  useEffect(() => {
    if (autoFocus && buttonRef.current && !disabled) {
      buttonRef.current.focus();
    }
  }, [autoFocus, disabled]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on scroll so position is recalculated on next open
  useEffect(() => {
    if (!isOpen) return;
    const close = () => {
      setIsOpen(false);
      setSearchTerm("");
    };
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="fb-relative fb-w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
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

      {/* Fixed-position menu — never clipped by overflow:auto parents */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: menuStyle.top,
            left: menuStyle.left,
            width: menuStyle.width,
            maxHeight: menuStyle.maxHeight,
            zIndex: 9999,
          }}
          className="fb-bg-input-bg fb-border fb-border-border fb-rounded-custom fb-shadow-lg fb-overflow-auto">
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
          <div className="fb-py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.province_id ?? option.district_ID ?? option.Neighbor_ID}
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

  // Which levels are visible
  const judiciaryEnabled = question.judiciary?.enabled !== false;
  const areaEnabled = question.area?.enabled !== false;

  // Active data source: customData overrides built-in JSON
  const locationData = (question.customData as any) ?? iraqLocationData;

  const isArabic = true;

  // Restore previous answer
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (parsed.province?.id) {
          const province = locationData.provinces.find((p: any) => p.province_id === parsed.province.id);
          if (province) {
            setSelectedProvince(province);
            if (judiciaryEnabled && parsed.judiciary?.id) {
              const judiciary = locationData.judiciaries.find(
                (j: any) => j.district_ID === parsed.judiciary.id && j.province_id === province.province_id
              );
              if (judiciary) {
                setSelectedJudiciary(judiciary);
                if (areaEnabled && parsed.area?.id) {
                  const area = locationData.areas.find(
                    (a: any) =>
                      a.Neighbor_ID === parsed.area.id &&
                      a.province_id === province.province_id &&
                      a.district_ID === judiciary.district_ID
                  );
                  if (area) setSelectedArea(area);
                }
              }
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Province list — apply enabledProvinceIds filter when using built-in data
  const provinces = useMemo(() => {
    const raw = locationData.provinces.filter((p: any) => p.province_id !== 0);
    if (!question.customData && question.enabledProvinceIds?.length) {
      return raw.filter((p: any) => question.enabledProvinceIds!.includes(p.province_id));
    }
    return raw;
  }, [locationData, question.customData, question.enabledProvinceIds]);

  const judiciaries = useMemo(() => {
    if (!selectedProvince) return [];
    return locationData.judiciaries.filter(
      (j: any) => j.province_id === selectedProvince.province_id && j.district_ID !== 0
    );
  }, [selectedProvince, locationData]);

  const areas = useMemo(() => {
    if (!selectedProvince || !selectedJudiciary) return [];
    return locationData.areas.filter(
      (a: any) =>
        a.province_id === selectedProvince.province_id &&
        a.district_ID === selectedJudiciary.district_ID &&
        a.Neighbor_ID !== 0
    );
  }, [selectedProvince, selectedJudiciary, locationData]);

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

  const getProvinceDisplayName = (item: any) => (isArabic ? item["المحافظة"] : item.province) ?? "";
  const getJudiciaryDisplayName = (item: any) =>
    (isArabic ? item["المدينة او القضاء"] : item["The city or The judiciary "]) ?? "";
  const getAreaDisplayName = (item: any) =>
    (isArabic ? item["المنطقة او الحي"] : item["The Area or The Neighborhood"]) ?? "";

  const updateResponseData = (province: any, judiciary: any, area: any) => {
    if (!province) {
      onChange({ [question.id]: "" });
      return;
    }
    onChange({
      [question.id]: JSON.stringify({
        province: { id: province.province_id, name: getProvinceDisplayName(province), isOther: false },
        judiciary: judiciary
          ? { id: judiciary.district_ID, name: getJudiciaryDisplayName(judiciary), isOther: false }
          : null,
        area: area ? { id: area.Neighbor_ID, name: getAreaDisplayName(area), isOther: false } : null,
      }),
    });
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!isValid) return;

    const updatedTtc = getUpdatedTtc(ttc, question.id, performance.now() - startTime);
    setTtc(updatedTtc);

    onSubmit(
      {
        [question.id]: JSON.stringify({
          province: {
            id: selectedProvince.province_id,
            name: getProvinceDisplayName(selectedProvince),
            isOther: false,
          },
          judiciary:
            judiciaryEnabled && selectedJudiciary
              ? {
                  id: selectedJudiciary.district_ID,
                  name: getJudiciaryDisplayName(selectedJudiciary),
                  isOther: false,
                }
              : null,
          area:
            areaEnabled && selectedArea
              ? { id: selectedArea.Neighbor_ID, name: getAreaDisplayName(selectedArea), isOther: false }
              : null,
        }),
      },
      updatedTtc
    );
  };

  const isValid =
    !!selectedProvince &&
    (!judiciaryEnabled || !!selectedJudiciary) &&
    (!areaEnabled || !judiciaryEnabled || !!selectedArea);

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
            {/* Province */}
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

            {/* Judiciary — only if enabled */}
            {judiciaryEnabled && (
              <div className="fb-space-y-1">
                <label className="fb-text-subheading fb-text-sm fb-font-medium">
                  {getLocalizedValue(question.judiciary.label, languageCode) || "القضاء"}
                  {question.judiciary.required && <span className="fb-text-red-500 fb-ml-1">*</span>}
                </label>
                <SearchableDropdown
                  options={judiciaries}
                  selected={selectedJudiciary}
                  onSelect={handleJudiciaryChange}
                  placeholder={
                    getLocalizedValue(question.judiciary.placeholder, languageCode) || "اختر القضاء"
                  }
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
            )}

            {/* Area — only if both judiciary and area are enabled */}
            {judiciaryEnabled && areaEnabled && (
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
            )}
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
