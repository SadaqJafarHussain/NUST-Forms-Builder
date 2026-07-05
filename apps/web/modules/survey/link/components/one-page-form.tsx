"use client";

import { StarIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import iraqLocationData from "@formbricks/surveys/iraq-location-data";
import { TBaseStyling } from "@formbricks/types/styling";
import {
  TSurvey,
  TSurveyDropdownQuestion,
  TSurveyIraqLocationQuestion,
  TSurveyMatrixQuestion,
  TSurveyMultipleChoiceQuestion,
  TSurveyNPSQuestion,
  TSurveyOpenTextQuestion,
  TSurveyQuestion,
  TSurveyQuestionTypeEnum,
  TSurveyRatingQuestion,
} from "@formbricks/types/surveys/types";
import { BannerRenderer } from "@/modules/ui/components/banner-renderer";

// ── Extract text from an i18n string ─────────────────────────────────────────
const t = (val: any): string => {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val.ar ?? val.default ?? "";
};

// ── Resolve form colors from styling (with NUST defaults) ────────────────────
function resolveFormStyling(s?: TBaseStyling | null) {
  const brand = s?.brandColor?.light ?? "#1b335f";

  // Page background
  let pageBgStyle: React.CSSProperties = { backgroundColor: "#f0f4f8" };
  const bg = s?.background;
  if (bg?.bgType === "color" && bg?.bg) {
    pageBgStyle = { backgroundColor: bg.bg };
  } else if ((bg?.bgType === "image" || bg?.bgType === "upload") && bg?.bg) {
    pageBgStyle = {
      backgroundImage: `url(${bg.bg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    };
  }

  return {
    brand,
    cardBg: s?.cardBackgroundColor?.light ?? "#ffffff",
    cardBorder: s?.highlightBorderColor?.light ?? brand,
    inputBg: s?.inputColor?.light ?? "#ffffff",
    inputBd: s?.inputBorderColor?.light ?? "#cbd5e1",
    qColor: s?.questionColor?.light ?? "#1e293b",
    radius: s?.roundness != null ? `${s.roundness}px` : "12px",
    qFontSize:
      s && "questionFontSize" in s && (s as any).questionFontSize
        ? `${(s as any).questionFontSize}px`
        : "15px",
    pageBgStyle,
  };
}

interface OnepageFormProps {
  survey: TSurvey;
  publicDomain: string;
  isPreview?: boolean;
  projectName?: string;
  orgDefaultBannerConfig?: any;
  styling?: TBaseStyling | null;
}

type Answers = Record<string, any>;
type Errors = Record<string, boolean>;

// ── Input base helper — uses CSS vars set on the wrapper ──────────────────────
const inputBase = (hasError: boolean) =>
  `w-full border-2 px-4 py-3 text-sm placeholder-slate-400 transition focus:outline-none ${
    hasError ? "border-red-400" : "border-[var(--input-bd)] focus:border-[var(--brand)]"
  }`;

// ── Question renderers ────────────────────────────────────────────────────────

const OpenTextQuestion = ({
  question,
  value,
  onChange,
  hasError,
}: {
  question: TSurveyOpenTextQuestion;
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
}) => {
  const cls = inputBase(hasError);
  const style: React.CSSProperties = {
    borderRadius: "var(--radius)",
    backgroundColor: "var(--input-bg)",
    color: "var(--q-color)",
  };
  const inputType = question.inputType ?? "text";
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  if (inputType !== "text" || question.longAnswer === false) {
    return (
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t(question.placeholder)}
        className={cls}
        style={style}
      />
    );
  }
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleTextareaChange}
      placeholder={t(question.placeholder)}
      rows={1}
      className={`${cls} resize-none overflow-hidden`}
      style={{ ...style, minHeight: "44px" }}
    />
  );
};

const MultipleChoiceQuestion = ({
  question,
  value,
  onChange,
  hasError,
  choiceUsage = {},
}: {
  question: TSurveyMultipleChoiceQuestion;
  value: string | string[];
  onChange: (v: string | string[]) => void;
  hasError: boolean;
  choiceUsage?: Record<string, number>; // choiceId → count of responses
}) => {
  const isMulti = question.type === TSurveyQuestionTypeEnum.MultipleChoiceMulti;
  const selected: string[] = Array.isArray(value) ? value : value ? [value] : [];

  const isChoiceFull = (choiceId: string, limit?: number): boolean => {
    if (!limit) return false;
    return (choiceUsage[choiceId] ?? 0) >= limit;
  };

  const toggle = (label: string, choiceId: string, limit?: number) => {
    if (isChoiceFull(choiceId, limit)) return;
    if (isMulti) {
      onChange(selected.includes(label) ? selected.filter((s) => s !== label) : [...selected, label]);
    } else {
      onChange(label);
    }
  };

  return (
    <div className={`space-y-2.5 ${hasError ? "rounded-xl p-3 ring-2 ring-red-400" : ""}`}>
      {question.choices.map((choice) => {
        const label = t(choice.label);
        const checked = selected.includes(label);
        const isFull = isChoiceFull(choice.id, choice.limit);
        const usedCount = choiceUsage[choice.id] ?? 0;

        return (
          <label
            key={choice.id}
            className="flex items-center gap-4 border-2 px-4 py-3 text-sm font-medium transition-all"
            style={{
              borderRadius: "var(--radius)",
              borderColor: isFull ? "#cbd5e1" : checked ? "var(--brand)" : "var(--input-bd)",
              backgroundColor: isFull
                ? "#f8fafc"
                : checked
                  ? "color-mix(in srgb, var(--brand) 10%, white)"
                  : "var(--card-bg)",
              color: isFull ? "#94a3b8" : checked ? "var(--brand)" : "var(--q-color)",
              cursor: isFull ? "not-allowed" : "pointer",
              opacity: isFull ? 0.75 : 1,
            }}>
            <input
              type={isMulti ? "checkbox" : "radio"}
              checked={checked}
              disabled={isFull}
              onChange={() => toggle(label, choice.id, choice.limit)}
              className="h-4 w-4 flex-shrink-0"
              style={{ accentColor: "var(--brand)" }}
            />
            <span className="flex-1">{label}</span>
            {isFull && (
              <span
                className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                اكتملت المقاعد ({usedCount}/{choice.limit})
              </span>
            )}
            {!isFull && choice.limit && (
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                {choice.limit - usedCount} متبقٍ
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
};

const RatingQuestion = ({
  question,
  value,
  onChange,
  hasError,
}: {
  question: TSurveyRatingQuestion;
  value: number | null;
  onChange: (v: number) => void;
  hasError: boolean;
}) => {
  const range = question.range;
  const isStars = question.scale === "star";

  return (
    <div>
      <div className={`flex flex-wrap gap-2 ${hasError ? "rounded-xl p-3 ring-2 ring-red-400" : ""}`}>
        {Array.from({ length: range }, (_, i) => i + 1).map((n) => {
          const active = value !== null && n <= value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="flex h-11 w-11 items-center justify-center border-2 text-sm font-bold transition-all"
              style={{
                borderRadius: "var(--radius)",
                borderColor: active ? "var(--brand)" : "var(--input-bd)",
                backgroundColor: active ? "var(--brand)" : "var(--card-bg)",
                color: active ? "#fff" : "#64748b",
              }}>
              {isStars ? (
                <StarIcon
                  className="h-5 w-5"
                  style={{
                    fill: active ? "var(--brand)" : "none",
                    stroke: active ? "var(--brand)" : "#94a3b8",
                  }}
                />
              ) : (
                n
              )}
            </button>
          );
        })}
      </div>
      {(question.lowerLabel || question.upperLabel) && (
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>{t(question.lowerLabel)}</span>
          <span>{t(question.upperLabel)}</span>
        </div>
      )}
    </div>
  );
};

const NPSQuestion = ({
  question,
  value,
  onChange,
  hasError,
}: {
  question: TSurveyNPSQuestion;
  value: number | null;
  onChange: (v: number) => void;
  hasError: boolean;
}) => (
  <div>
    <div className={`flex flex-wrap gap-2 ${hasError ? "rounded-xl p-3 ring-2 ring-red-400" : ""}`}>
      {Array.from({ length: 11 }, (_, i) => i).map((n) => {
        // NPS uses semantic traffic-light colors — intentionally not brand-colored
        const activeColor = n <= 6 ? "#dc2626" : n <= 8 ? "#d97706" : "#16a34a";
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all"
            style={
              value === n
                ? { backgroundColor: activeColor, borderColor: activeColor, color: "#fff" }
                : {
                    borderColor: "var(--input-bd)",
                    backgroundColor: "var(--card-bg)",
                    color: "var(--q-color)",
                  }
            }>
            {n}
          </button>
        );
      })}
    </div>
    <div className="mt-2 flex justify-between text-xs text-slate-400">
      <span>{t(question.lowerLabel) || "غير محتمل أبداً"}</span>
      <span>{t(question.upperLabel) || "محتمل جداً"}</span>
    </div>
  </div>
);

const DateQuestion = ({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
}) => (
  <input
    type="date"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={inputBase(hasError)}
    style={{
      borderRadius: "var(--radius)",
      backgroundColor: "var(--input-bg)",
      color: "var(--q-color)",
    }}
  />
);

const MatrixQuestion = ({
  question,
  value,
  onChange,
  hasError,
}: {
  question: TSurveyMatrixQuestion;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  hasError: boolean;
}) => {
  const current = value ?? {};
  return (
    <div className={`overflow-x-auto rounded-xl ${hasError ? "p-2 ring-2 ring-red-400" : ""}`}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: "color-mix(in srgb, var(--brand) 8%, white)" }}>
            <th className="w-40 rounded-tr-lg py-3 pr-4 text-right font-semibold text-slate-600" />
            {question.columns.map((col) => (
              <th
                key={col.id}
                className="px-3 py-3 text-center font-semibold"
                style={{ color: "var(--q-color)" }}>
                {t(col.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {question.rows.map((row, rowIdx) => {
            const rowLabel = t(row.label);
            return (
              <tr key={row.id} style={{ backgroundColor: rowIdx % 2 === 0 ? "var(--card-bg)" : "#f8fafc" }}>
                <td className="py-3 pr-4 font-medium" style={{ color: "var(--q-color)" }}>
                  {rowLabel}
                </td>
                {question.columns.map((col) => {
                  const colLabel = t(col.label);
                  return (
                    <td key={col.id} className="px-3 py-3 text-center">
                      <input
                        type="radio"
                        name={`matrix-${question.id}-${row.id}`}
                        checked={current[rowLabel] === colLabel}
                        onChange={() => onChange({ ...current, [rowLabel]: colLabel })}
                        className="h-4 w-4"
                        style={{ accentColor: "var(--brand)" }}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Dropdown ──────────────────────────────────────────────────────────────────

const DropdownQuestion = ({
  question,
  value,
  onChange,
  hasError,
}: {
  question: TSurveyDropdownQuestion;
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0, maxHeight: 240 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const getLabel = (choice: (typeof question.choices)[0]) => t(choice.label);

  const filtered = question.choices.filter((c) =>
    getLabel(c).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
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
    }
    setIsOpen((v) => !v);
    setSearchTerm("");
  };

  const handleSelect = (label: string) => {
    onChange(label);
    setIsOpen(false);
    setSearchTerm("");
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const closeOnScroll = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setIsOpen(false);
      setSearchTerm("");
    };
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [isOpen]);

  const placeholder = t(question.placeholder) || "اختر من القائمة...";

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="relative w-full border-2 text-sm transition focus:outline-none"
        style={{
          borderRadius: "var(--radius)",
          borderColor: hasError ? "#f87171" : isOpen ? "var(--brand)" : "var(--input-bd)",
          backgroundColor: "var(--input-bg)",
          color: value ? "var(--q-color)" : "#94a3b8",
          textAlign: "right",
          direction: "rtl",
          padding: "0.75rem 1rem 0.75rem 2.5rem",
        }}>
        <span className="block truncate">{value || placeholder}</span>
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <svg
            style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
            className="h-4 w-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

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
            borderRadius: "var(--radius)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          className="border border-slate-200 bg-white shadow-xl">
          <div className="flex-shrink-0 border-b border-slate-100 p-2">
            <input
              autoFocus
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث..."
              className="w-full border border-slate-200 px-3 py-2 text-right text-sm focus:border-[var(--brand)] focus:outline-none"
              style={{ borderRadius: "var(--radius)" }}
            />
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {filtered.length > 0 ? (
              filtered.map((choice) => {
                const label = getLabel(choice);
                const isSel = value === label;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleSelect(label)}
                    className="w-full px-4 py-2.5 text-right text-sm transition hover:bg-slate-50"
                    style={{
                      color: isSel ? "var(--brand)" : "#374151",
                      fontWeight: isSel ? 600 : 400,
                      backgroundColor: isSel ? "color-mix(in srgb, var(--brand) 8%, white)" : "transparent",
                    }}>
                    {label}
                  </button>
                );
              })
            ) : (
              <p className="px-4 py-3 text-center text-sm text-slate-400">لا توجد نتائج</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Iraq Location ─────────────────────────────────────────────────────────────

const ILSearchableDropdown = ({
  options,
  selected,
  onSelect,
  placeholder,
  getDisplayName,
  disabled = false,
  hasError = false,
}: {
  options: any[];
  selected: any;
  onSelect: (item: any) => void;
  placeholder: string;
  getDisplayName: (item: any) => string;
  disabled?: boolean;
  hasError?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0, maxHeight: 240 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) => getDisplayName(o).toLowerCase().includes(searchTerm.toLowerCase()));

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && buttonRef.current) {
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
    }
    setIsOpen((v) => !v);
    setSearchTerm("");
  };

  const handleSelect = (opt: any) => {
    onSelect(opt);
    setIsOpen(false);
    setSearchTerm("");
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    // Close on scroll outside the dropdown menu
    const closeOnScroll = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setIsOpen(false);
      setSearchTerm("");
    };
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [isOpen]);

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="relative w-full border-2 text-sm transition focus:outline-none"
        style={{
          borderRadius: "var(--radius)",
          borderColor: hasError ? "#f87171" : isOpen ? "var(--brand)" : "var(--input-bd)",
          backgroundColor: "var(--input-bg)",
          color: selected ? "var(--q-color)" : "#94a3b8",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          textAlign: "right",
          direction: "rtl",
          padding: "0.75rem 1.5rem 0.75rem 2.5rem",
        }}>
        <span className="block truncate">{selected ? getDisplayName(selected) : placeholder}</span>
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <svg
            style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
            className="h-4 w-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

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
            borderRadius: "var(--radius)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          className="border border-slate-200 bg-white shadow-xl">
          <div className="flex-shrink-0 border-b border-slate-100 p-2">
            <input
              autoFocus
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث..."
              className="w-full border border-slate-200 px-3 py-2 text-right text-sm focus:border-[var(--brand)] focus:outline-none"
              style={{ borderRadius: "var(--radius)" }}
            />
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {filtered.length > 0 ? (
              filtered.map((opt, idx) => {
                const key = `${idx}-${opt.province_id ?? opt.district_ID ?? opt.Neighbor_ID}`;
                const isSel =
                  selected &&
                  ((opt.province_id && selected.province_id === opt.province_id) ||
                    (opt.district_ID && selected.district_ID === opt.district_ID) ||
                    (opt.Neighbor_ID && selected.Neighbor_ID === opt.Neighbor_ID));
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className="w-full px-4 py-2 text-right text-sm transition hover:bg-slate-50"
                    style={{ color: isSel ? "var(--brand)" : "#374151", fontWeight: isSel ? 600 : 400 }}>
                    {getDisplayName(opt)}
                  </button>
                );
              })
            ) : (
              <p className="px-4 py-3 text-center text-sm text-slate-400">لا توجد نتائج</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const IraqLocationQuestionWidget = ({
  question,
  value,
  onChange,
  hasError,
}: {
  question: TSurveyIraqLocationQuestion;
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
}) => {
  const locationData = (question.customData as any) ?? iraqLocationData;
  const judiciaryEnabled = question.judiciary?.enabled !== false;
  const areaEnabled = question.area?.enabled !== false;

  const parsed = useMemo(() => {
    if (!value) return { province: null, judiciary: null, area: null };
    try {
      return JSON.parse(value);
    } catch {
      return { province: null, judiciary: null, area: null };
    }
  }, [value]);

  const [selectedProvince, setSelectedProvince] = useState<any>(() => {
    if (!parsed.province?.id) return null;
    return locationData.provinces.find((p: any) => p.province_id === parsed.province.id) ?? null;
  });
  const [selectedJudiciary, setSelectedJudiciary] = useState<any>(() => {
    if (!judiciaryEnabled || !parsed.judiciary?.id || !parsed.province?.id) return null;
    return (
      locationData.judiciaries.find(
        (j: any) => j.district_ID === parsed.judiciary.id && j.province_id === parsed.province.id
      ) ?? null
    );
  });
  const [selectedArea, setSelectedArea] = useState<any>(() => {
    if (!areaEnabled || !parsed.area?.id || !parsed.province?.id || !parsed.judiciary?.id) return null;
    return (
      locationData.areas.find(
        (a: any) =>
          a.Neighbor_ID === parsed.area.id &&
          a.province_id === parsed.province.id &&
          a.district_ID === parsed.judiciary.id
      ) ?? null
    );
  });

  const provinces = useMemo(() => {
    const raw = locationData.provinces.filter((p: any) => p.province_id !== 0);
    if (!question.customData && question.enabledProvinceIds?.length) {
      return raw.filter((p: any) => (question.enabledProvinceIds as number[]).includes(p.province_id));
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

  const getProvinceName = (item: any) => item["المحافظة"] ?? item.province ?? "";
  const getJudiciaryName = (item: any) =>
    item["المدينة او القضاء"] ?? item["The city or The judiciary "] ?? "";
  const getAreaName = (item: any) => item["المنطقة او الحي"] ?? item["The Area or The Neighborhood"] ?? "";

  const emitChange = (prov: any, jud: any, ar: any) => {
    if (!prov) {
      onChange("");
      return;
    }
    onChange(
      JSON.stringify({
        province: { id: prov.province_id, name: getProvinceName(prov), isOther: false },
        judiciary: jud ? { id: jud.district_ID, name: getJudiciaryName(jud), isOther: false } : null,
        area: ar ? { id: ar.Neighbor_ID, name: getAreaName(ar), isOther: false } : null,
      })
    );
  };

  const handleProvince = (p: any) => {
    setSelectedProvince(p);
    setSelectedJudiciary(null);
    setSelectedArea(null);
    emitChange(p, null, null);
  };
  const handleJudiciary = (j: any) => {
    setSelectedJudiciary(j);
    setSelectedArea(null);
    emitChange(selectedProvince, j, null);
  };
  const handleArea = (a: any) => {
    setSelectedArea(a);
    emitChange(selectedProvince, selectedJudiciary, a);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold" style={{ color: "var(--q-color)" }}>
          {t(question.province?.label) || "المحافظة"}
          {question.province?.required && <span className="mr-1 text-red-500">*</span>}
        </label>
        <ILSearchableDropdown
          options={provinces}
          selected={selectedProvince}
          onSelect={handleProvince}
          placeholder={t(question.province?.placeholder) || "اختر المحافظة"}
          getDisplayName={getProvinceName}
          hasError={hasError && !selectedProvince}
        />
      </div>
      {judiciaryEnabled && (
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold" style={{ color: "var(--q-color)" }}>
            {t(question.judiciary?.label) || "القضاء / المدينة"}
            {question.judiciary?.required && <span className="mr-1 text-red-500">*</span>}
          </label>
          <ILSearchableDropdown
            options={judiciaries}
            selected={selectedJudiciary}
            onSelect={handleJudiciary}
            placeholder={t(question.judiciary?.placeholder) || "اختر القضاء"}
            getDisplayName={getJudiciaryName}
            disabled={!selectedProvince}
            hasError={hasError && judiciaryEnabled && !selectedJudiciary}
          />
          {!selectedProvince && <p className="text-xs text-slate-400">يجب اختيار المحافظة أولاً</p>}
        </div>
      )}
      {judiciaryEnabled && areaEnabled && (
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold" style={{ color: "var(--q-color)" }}>
            {t(question.area?.label) || "المنطقة / الحي"}
            {question.area?.required && <span className="mr-1 text-red-500">*</span>}
          </label>
          <ILSearchableDropdown
            options={areas}
            selected={selectedArea}
            onSelect={handleArea}
            placeholder={t(question.area?.placeholder) || "اختر المنطقة"}
            getDisplayName={getAreaName}
            disabled={!selectedJudiciary}
            hasError={hasError && areaEnabled && !selectedArea}
          />
          {!selectedJudiciary && <p className="text-xs text-slate-400">يجب اختيار القضاء أولاً</p>}
        </div>
      )}
    </div>
  );
};

// ── Main OnepageForm ──────────────────────────────────────────────────────────

export const OnepageForm = ({
  survey,
  publicDomain,
  isPreview = false,
  projectName,
  orgDefaultBannerConfig,
  styling,
}: OnepageFormProps) => {
  const colors = useMemo(() => resolveFormStyling(styling), [styling]);

  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // choiceUsage: { [questionId]: { [choiceId]: count } }
  const [choiceUsage, setChoiceUsage] = useState<Record<string, Record<string, number>>>({});
  // Real-time deadline enforcement
  const [deadlineExpired, setDeadlineExpired] = useState(false);
  const [deadlineRemaining, setDeadlineRemaining] = useState<string | null>(null);

  // Fetch and poll choice usage counts for limited choices
  useEffect(() => {
    if (isPreview) return;
    const hasLimits = survey.questions.some(
      (q) =>
        (q.type === TSurveyQuestionTypeEnum.MultipleChoiceSingle ||
          q.type === TSurveyQuestionTypeEnum.MultipleChoiceMulti) &&
        (q as TSurveyMultipleChoiceQuestion).choices.some((c) => c.limit != null)
    );
    if (!hasLimits) return;

    const fetchUsage = async () => {
      try {
        const res = await fetch(
          `${publicDomain}/api/v1/client/${survey.environmentId}/surveys/${survey.id}/choice-usage`
        );
        if (res.ok) {
          const json = await res.json();
          setChoiceUsage(json.data ?? {}); // json.data = { questionId: { choiceId: count } }
        }
      } catch {
        // fail silently — real-time update is best-effort
      }
    };

    void fetchUsage();
    const interval = setInterval(fetchUsage, 30_000);
    return () => clearInterval(interval);
  }, [survey.id, survey.environmentId, publicDomain, isPreview, survey.questions]);

  // Real-time deadline check — ticks every second
  useEffect(() => {
    if (!survey.scheduledClosingAt || isPreview) return;
    const deadline = new Date(survey.scheduledClosingAt);

    const computeRemaining = () => {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) {
        setDeadlineExpired(true);
        setDeadlineRemaining(null);
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const parts: string[] = [];
      if (days > 0) parts.push(`${days}ي`);
      if (hours > 0) parts.push(`${hours}س`);
      if (minutes > 0) parts.push(`${minutes}د`);
      parts.push(`${seconds}ث`);
      setDeadlineRemaining(parts.join(" "));
    };

    computeRemaining();
    const id = setInterval(computeRemaining, 1000);
    return () => clearInterval(id);
  }, [survey.scheduledClosingAt, isPreview]);

  const setAnswer = (qId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    setErrors((prev) => ({ ...prev, [qId]: false }));
  };

  // ── Conditional visibility ────────────────────────────────────────────────
  const evaluateSingleCondition = (condition: any, ans: Answers): boolean => {
    const { leftOperand, operator, rightOperand } = condition;
    const answer = ans[leftOperand?.value];
    const expected = rightOperand?.value;
    const str = (v: any) => String(v ?? "");
    const num = (v: any) => Number(v ?? 0);
    switch (operator) {
      case "equals":
        return str(answer) === str(expected);
      case "doesNotEqual":
        return str(answer) !== str(expected);
      case "equalsOneOf":
        return Array.isArray(expected)
          ? expected.map(str).includes(str(answer))
          : str(answer) === str(expected);
      case "doesNotEqualOneOf":
        return Array.isArray(expected)
          ? !expected.map(str).includes(str(answer))
          : str(answer) !== str(expected);
      case "contains":
        return str(answer).toLowerCase().includes(str(expected).toLowerCase());
      case "doesNotContain":
        return !str(answer).toLowerCase().includes(str(expected).toLowerCase());
      case "isSubmitted":
        return answer !== undefined && answer !== "" && !(Array.isArray(answer) && answer.length === 0);
      case "isSkipped":
        return answer === undefined || answer === "" || (Array.isArray(answer) && answer.length === 0);
      case "isGreaterThan":
        return num(answer) > num(expected);
      case "isLessThan":
        return num(answer) < num(expected);
      case "isGreaterThanOrEqual":
        return num(answer) >= num(expected);
      case "isLessThanOrEqual":
        return num(answer) <= num(expected);
      case "includesOneOf": {
        const arr = Array.isArray(answer) ? answer.map(str) : [str(answer)];
        const exp = Array.isArray(expected) ? expected.map(str) : [str(expected)];
        return exp.some((e) => arr.includes(e));
      }
      case "includesAllOf": {
        const arr = Array.isArray(answer) ? answer.map(str) : [str(answer)];
        const exp = Array.isArray(expected) ? expected.map(str) : [str(expected)];
        return exp.every((e) => arr.includes(e));
      }
      default:
        return true;
    }
  };

  const evaluateConditionGroup = (group: any, ans: Answers): boolean => {
    if (!group?.conditions?.length) return true;
    const results: boolean[] = group.conditions.map((c: any) =>
      "connector" in c ? evaluateConditionGroup(c, ans) : evaluateSingleCondition(c, ans)
    );
    return group.connector === "or" ? results.some(Boolean) : results.every(Boolean);
  };

  const conditionalTargetIds = new Set<string>();
  survey.questions.forEach((q) => {
    (q.logic ?? []).forEach((rule: any) => {
      (rule.actions ?? []).forEach((action: any) => {
        if (action.objective === "jumpToQuestion" && action.target) {
          conditionalTargetIds.add(action.target);
        }
      });
    });
  });

  const visibleConditionalIds = new Set<string>();
  survey.questions.forEach((q) => {
    (q.logic ?? []).forEach((rule: any) => {
      if (evaluateConditionGroup(rule.conditions, answers)) {
        (rule.actions ?? []).forEach((action: any) => {
          if (action.objective === "jumpToQuestion" && action.target) {
            visibleConditionalIds.add(action.target);
          }
        });
      }
    });
  });

  const isQuestionVisible = (qId: string): boolean =>
    !conditionalTargetIds.has(qId) || visibleConditionalIds.has(qId);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Errors = {};
    let valid = true;
    for (const q of survey.questions) {
      if (!isQuestionVisible(q.id)) continue;
      if (!q.required) continue;
      const val = answers[q.id];

      if (q.type === TSurveyQuestionTypeEnum.IraqLocation) {
        const ilq = q as TSurveyIraqLocationQuestion;
        let ilValid = false;
        if (val) {
          try {
            const p = JSON.parse(val as string);
            const je = ilq.judiciary?.enabled !== false;
            const ae = ilq.area?.enabled !== false;
            ilValid = !!p.province?.id && (!je || !!p.judiciary?.id) && (!ae || !je || !!p.area?.id);
          } catch {
            ilValid = false;
          }
        }
        if (!ilValid) {
          newErrors[q.id] = true;
          valid = false;
        }
        continue;
      }

      const isEmpty =
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0) ||
        (typeof val === "object" && !Array.isArray(val) && Object.keys(val).length === 0);
      if (isEmpty) {
        newErrors[q.id] = true;
        valid = false;
      }
    }
    setErrors(newErrors);
    if (!valid) {
      const firstErrorId = Object.keys(newErrors)[0];
      document.getElementById(`q-${firstErrorId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return valid;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const ending = survey.endings?.[0];
      const visibleAnswers = Object.fromEntries(
        Object.entries(answers).filter(([qId]) => isQuestionVisible(qId))
      );
      const res = await fetch(`${publicDomain}/api/v1/client/${survey.environmentId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environmentId: survey.environmentId,
          surveyId: survey.id,
          finished: true,
          endingId: ending?.id,
          data: visibleAnswers,
          meta: { url: typeof window !== "undefined" ? window.location.href : "" },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData?.message === "deadline_passed") {
          setDeadlineExpired(true);
          return;
        }
        if (errData?.message === "choice_limit_exceeded") {
          // Re-fetch fresh counts so the form shows the updated grayed-out state
          try {
            const usageRes = await fetch(
              `${publicDomain}/api/v1/client/${survey.environmentId}/surveys/${survey.id}/choice-usage`
            );
            if (usageRes.ok) {
              const json = await usageRes.json();
              setChoiceUsage(json.data ?? {});
            }
          } catch {
            // best-effort
          }
          throw new Error(
            "عذراً، اكتملت مقاعد أحد الخيارات التي اخترتها. يرجى مراجعة اختياراتك والمحاولة مجدداً"
          );
        }
        throw new Error(errData?.message ?? "فشل الإرسال");
      }
      // Refresh choice usage so counts reflect this submission
      try {
        const usageRes = await fetch(
          `${publicDomain}/api/v1/client/${survey.environmentId}/surveys/${survey.id}/choice-usage`
        );
        if (usageRes.ok) {
          const json = await usageRes.json();
          setChoiceUsage(json.data ?? {}); // json.data = { questionId: { choiceId: count } }
        }
      } catch {
        // best-effort
      }
      setSubmitted(true);
    } catch (e: any) {
      setSubmitError(e?.message ?? "حدث خطأ، يرجى المحاولة مجدداً");
    } finally {
      setSubmitting(false);
    }
  };

  // ── CSS vars injected on the wrapper so all children use var(--brand) etc. ─
  const cssVars = {
    "--brand": colors.brand,
    "--card-bg": colors.cardBg,
    "--card-border": colors.cardBorder,
    "--input-bg": colors.inputBg,
    "--input-bd": colors.inputBd,
    "--q-color": colors.qColor,
    "--radius": colors.radius,
    "--q-size": colors.qFontSize,
  } as React.CSSProperties;

  // ── Deadline expired screen ───────────────────────────────────────────────
  if (deadlineExpired) {
    return (
      <div className="min-h-screen w-full" dir="rtl" style={{ ...colors.pageBgStyle, ...cssVars }}>
        {/* NUST Header Banner */}
        <div className="w-full" style={{ backgroundColor: "#1b335f" }}>
          <div className="h-2 w-full" style={{ backgroundColor: "#f4bf00" }} />
          <p
            className="pt-3 text-center text-sm font-medium"
            style={{ color: "#f4bf00", fontFamily: "serif" }}>
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </p>
          <div className="px-4 py-3 sm:px-10 sm:py-5">
            <div className="hidden w-full items-center justify-between gap-6 sm:flex">
              <div className="flex flex-1 flex-col items-end gap-1 text-right">
                <p className="text-xl font-extrabold text-white">الجامعة الوطنية للعلوم والتكنولوجيا</p>
                <p className="text-sm font-semibold" style={{ color: "#f4bf00" }}>
                  نظام الاستبيانات الإلكتروني
                </p>
              </div>
              <div className="flex-shrink-0 rounded-full p-1.5" style={{ backgroundColor: "#f4bf00" }}>
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white p-2">
                  <img
                    src="/images/logo.png"
                    alt="شعار الجامعة"
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col items-start gap-1 text-left">
                <p className="text-xl font-extrabold text-white">
                  National University of Sciences &amp; Technology
                </p>
                <p className="text-sm font-semibold" style={{ color: "#f4bf00" }}>
                  Electronic Survey System
                </p>
              </div>
            </div>
          </div>
          <div
            className="mx-4 sm:mx-10"
            style={{ height: "2px", backgroundColor: "#f4bf00", opacity: 0.6 }}
          />
          <div className="h-2 w-full" style={{ backgroundColor: "#f4bf00" }} />
        </div>
        {/* Card */}
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
          <div
            className="w-full max-w-lg rounded-2xl bg-white text-center shadow-lg"
            style={{ border: "1px solid #e2e8f0" }}>
            <div className="h-1.5 w-full rounded-t-2xl" style={{ backgroundColor: "#1b335f" }} />
            <div className="px-8 py-10">
              <div
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full text-5xl font-bold"
                style={{ backgroundColor: "#dc262618", color: "#dc2626", border: "2px solid #dc262630" }}>
                🔒
              </div>
              <span
                className="mb-5 inline-block rounded-full px-4 py-1 text-sm font-semibold"
                style={{ backgroundColor: "#dc262618", color: "#dc2626", border: "1px solid #dc262640" }}>
                مغلق تلقائياً
              </span>
              <h1 className="mb-3 text-2xl font-bold" style={{ color: "#1b335f" }}>
                انتهى وقت الإجابة
              </h1>
              <p className="text-base leading-relaxed text-slate-500">
                لقد انتهت المدة المحددة لهذا الفورم وأُغلق تلقائياً. شكراً لاهتمامك.
              </p>
              <div className="mx-auto my-8 h-0.5 w-16 rounded-full" style={{ backgroundColor: "#f4bf00" }} />
              <p className="text-xs text-slate-400">
                نظام الاستبيانات الإلكتروني — الجامعة الوطنية للعلوم والتكنولوجيا
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    const ending = survey.endings?.[0];
    const endingHeadline = ending && "headline" in ending ? t((ending as any).headline) : null;
    const endingSubheader = ending && "subheader" in ending ? t((ending as any).subheader) : null;
    return (
      <div className="min-h-screen w-full" dir="rtl" style={{ ...colors.pageBgStyle, ...cssVars }}>
        {/* NUST Header Banner (always shown on success screen) */}
        <div className="w-full" style={{ backgroundColor: "#1b335f" }}>
          <div className="h-2 w-full" style={{ backgroundColor: "#f4bf00" }} />
          <p
            className="pt-3 text-center text-sm font-medium"
            style={{ color: "#f4bf00", fontFamily: "serif" }}>
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </p>
          <div className="px-4 py-3 sm:px-10 sm:py-5">
            <div className="flex flex-col items-center gap-3 sm:hidden">
              <div className="rounded-full p-1" style={{ backgroundColor: "#f4bf00" }}>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white p-1">
                  <img
                    src="/images/logo.png"
                    alt="شعار الجامعة"
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-base font-extrabold text-white">الجامعة الوطنية للعلوم والتكنولوجيا</p>
                <p className="text-xs font-semibold" style={{ color: "#f4bf00" }}>
                  NUST — نظام الاستبيانات
                </p>
              </div>
            </div>
            <div className="hidden w-full items-center justify-between gap-6 sm:flex">
              <div className="flex flex-1 flex-col items-end gap-1 text-right">
                <p className="text-xl font-extrabold text-white">الجامعة الوطنية للعلوم والتكنولوجيا</p>
                <p className="text-sm font-semibold" style={{ color: "#f4bf00" }}>
                  نظام الاستبيانات الإلكتروني
                </p>
              </div>
              <div className="flex-shrink-0 rounded-full p-1.5" style={{ backgroundColor: "#f4bf00" }}>
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white p-2">
                  <img
                    src="/images/logo.png"
                    alt="شعار الجامعة"
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col items-start gap-1 text-left">
                <p className="text-xl font-extrabold text-white">
                  National University of Sciences & Technology
                </p>
                <p className="text-sm font-semibold" style={{ color: "#f4bf00" }}>
                  Electronic Survey System
                </p>
              </div>
            </div>
          </div>
          <div
            className="mx-4 sm:mx-10"
            style={{ height: "2px", backgroundColor: "#f4bf00", opacity: 0.6 }}
          />
          <div className="h-2 w-full" style={{ backgroundColor: "#f4bf00" }} />
        </div>

        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
          <div
            className="w-full max-w-lg text-center shadow-lg"
            style={{
              backgroundColor: colors.cardBg,
              border: "1px solid #e2e8f0",
              borderRadius: colors.radius,
            }}>
            <div
              className="h-1.5 w-full"
              style={{
                backgroundColor: colors.cardBorder,
                borderRadius: `${colors.radius} ${colors.radius} 0 0`,
              }}
            />
            <div className="px-8 py-10">
              <div
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full text-5xl font-bold"
                style={{ backgroundColor: "#16a34a18", color: "#16a34a", border: "2px solid #16a34a30" }}>
                ✓
              </div>
              <span
                className="mb-5 inline-block rounded-full px-4 py-1 text-sm font-semibold"
                style={{ backgroundColor: "#16a34a18", color: "#15803d", border: "1px solid #16a34a40" }}>
                تم الإرسال بنجاح
              </span>
              <h1 className="mb-3 text-2xl font-bold" style={{ color: colors.brand }}>
                {endingHeadline || "شكراً لمشاركتك!"}
              </h1>
              <p className="text-base leading-relaxed text-slate-500">
                {endingSubheader || "تم استلام ردك بنجاح وتسجيله في النظام. نقدر وقتك واهتمامك."}
              </p>
              <div
                className="mx-auto my-8 h-0.5 w-16 rounded-full"
                style={{ backgroundColor: colors.brand, opacity: 0.4 }}
              />
              <p className="text-xs text-slate-400">
                نظام الاستبيانات الإلكتروني — الجامعة الوطنية للعلوم والتكنولوجيا
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render a single question card ─────────────────────────────────────────
  const renderQuestion = (q: TSurveyQuestion, idx: number) => {
    const hasError = errors[q.id] === true;
    let widget: React.ReactNode = null;

    switch (q.type) {
      case TSurveyQuestionTypeEnum.OpenText:
        widget = (
          <OpenTextQuestion
            question={q as TSurveyOpenTextQuestion}
            value={answers[q.id] ?? ""}
            onChange={(v) => setAnswer(q.id, v)}
            hasError={hasError}
          />
        );
        break;
      case TSurveyQuestionTypeEnum.MultipleChoiceSingle:
      case TSurveyQuestionTypeEnum.MultipleChoiceMulti:
        widget = (
          <MultipleChoiceQuestion
            question={q as TSurveyMultipleChoiceQuestion}
            value={answers[q.id] ?? (q.type === TSurveyQuestionTypeEnum.MultipleChoiceMulti ? [] : "")}
            onChange={(v) => setAnswer(q.id, v)}
            hasError={hasError}
            choiceUsage={choiceUsage[q.id]}
          />
        );
        break;
      case TSurveyQuestionTypeEnum.Rating:
        widget = (
          <RatingQuestion
            question={q as TSurveyRatingQuestion}
            value={answers[q.id] ?? null}
            onChange={(v) => setAnswer(q.id, v)}
            hasError={hasError}
          />
        );
        break;
      case TSurveyQuestionTypeEnum.NPS:
        widget = (
          <NPSQuestion
            question={q as TSurveyNPSQuestion}
            value={answers[q.id] ?? null}
            onChange={(v) => setAnswer(q.id, v)}
            hasError={hasError}
          />
        );
        break;
      case TSurveyQuestionTypeEnum.Date:
        widget = (
          <DateQuestion
            value={answers[q.id] ?? ""}
            onChange={(v) => setAnswer(q.id, v)}
            hasError={hasError}
          />
        );
        break;
      case TSurveyQuestionTypeEnum.Matrix:
        widget = (
          <MatrixQuestion
            question={q as TSurveyMatrixQuestion}
            value={answers[q.id] ?? {}}
            onChange={(v) => setAnswer(q.id, v)}
            hasError={hasError}
          />
        );
        break;
      case TSurveyQuestionTypeEnum.IraqLocation:
        widget = (
          <IraqLocationQuestionWidget
            question={q as TSurveyIraqLocationQuestion}
            value={answers[q.id] ?? ""}
            onChange={(v) => setAnswer(q.id, v)}
            hasError={hasError}
          />
        );
        break;
      case TSurveyQuestionTypeEnum.Dropdown:
        widget = (
          <DropdownQuestion
            question={q as TSurveyDropdownQuestion}
            value={answers[q.id] ?? ""}
            onChange={(v) => setAnswer(q.id, v)}
            hasError={hasError}
          />
        );
        break;
      default:
        widget = (
          <input
            type="text"
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            className={inputBase(hasError)}
            style={{
              borderRadius: "var(--radius)",
              backgroundColor: "var(--input-bg)",
              color: "var(--q-color)",
            }}
          />
        );
    }

    return (
      <div
        key={q.id}
        id={`q-${q.id}`}
        className="p-4 shadow-sm sm:p-6"
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: "var(--radius)",
          borderTop: `3px solid ${hasError ? "#f87171" : "var(--card-border)"}`,
        }}>
        <div className="mb-3 flex items-start gap-3">
          <span
            className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: hasError ? "#ef4444" : "var(--brand)" }}>
            {idx + 1}
          </span>
          <p
            className="font-semibold leading-relaxed"
            style={{ color: "var(--q-color)", fontSize: "var(--q-size)" }}>
            {t(q.headline)}
            {q.required && <span className="mr-1 text-red-500">*</span>}
          </p>
        </div>
        {t((q as any).subheader) && (
          <p className="mb-3 pr-10 text-xs text-slate-500">{t((q as any).subheader)}</p>
        )}
        <div className="pr-10">{widget}</div>
        {hasError && <p className="mt-2 pr-10 text-xs text-red-500">هذا الحقل مطلوب</p>}
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="nust-form min-h-screen" dir="rtl" style={{ ...colors.pageBgStyle, ...cssVars }}>
      {/* Dynamic focus / accent styles — scoped to .nust-form */}
      <style>{`
        .nust-form input:focus,
        .nust-form textarea:focus,
        .nust-form select:focus {
          border-color: var(--brand) !important;
          outline: none;
        }
        .nust-form input[type="radio"],
        .nust-form input[type="checkbox"] {
          accent-color: var(--brand);
        }
      `}</style>

      {/* Banner */}
      {(survey.bannerConfig ?? orgDefaultBannerConfig) && (
        <BannerRenderer
          config={survey.bannerConfig ?? orgDefaultBannerConfig}
          surveyTitle={survey.name}
          projectName={projectName}
          titleBg={(styling as any)?.bannerTitleBg}
          titleTextColor={(styling as any)?.bannerTitleTextColor}
          subtitleColor={(styling as any)?.bannerSubtitleColor}
        />
      )}

      {/* Deadline countdown banner */}
      {survey.scheduledClosingAt && !isPreview && deadlineRemaining && (
        <div className="mx-auto max-w-2xl px-3 pt-4 sm:px-5">
          <div
            className="flex items-center gap-2.5 rounded-lg px-4 py-2.5"
            style={{ backgroundColor: "#1b335f0d", border: "1px solid #1b335f25" }}>
            <span className="text-base">⏱</span>
            <p className="text-sm font-medium" style={{ color: "#1b335f" }}>
              يُغلق الفورم تلقائياً بعد: <span className="font-bold tabular-nums">{deadlineRemaining}</span>
            </p>
          </div>
        </div>
      )}

      {/* Form title */}
      {survey.name && (
        <div className="mx-auto max-w-2xl px-3 pt-6 sm:px-5" style={{ color: "var(--q-color)" }}>
          <h1 className="text-2xl font-bold">{survey.name}</h1>
          {(survey as any).description && (
            <p className="mt-1 text-sm text-slate-500">{(survey as any).description}</p>
          )}
        </div>
      )}

      {/* Questions */}
      <div className="mx-auto max-w-2xl px-3 py-5 sm:px-5 sm:py-8">
        <div className="space-y-4">
          {survey.questions.map((q, idx) => {
            if (!isQuestionVisible(q.id)) return null;
            return renderQuestion(q, idx);
          })}
        </div>

        {submitError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <div className="mt-6 pb-8">
          <button
            type="button"
            onClick={isPreview || deadlineExpired ? undefined : handleSubmit}
            disabled={submitting || isPreview || deadlineExpired}
            className="w-full py-4 text-base font-bold text-white shadow-sm transition-opacity disabled:opacity-50 sm:w-auto sm:px-12"
            style={{ backgroundColor: colors.brand, borderRadius: colors.radius }}>
            {submitting ? "جارٍ الإرسال…" : "إرسال الفورم"}
          </button>
          {isPreview && <p className="mt-2 text-xs text-slate-400">معاينة فقط — لا يمكن الإرسال</p>}
          {deadlineExpired && (
            <p className="mt-2 text-xs text-red-500">انتهى وقت الإجابة — هذا الفورم مغلق الآن</p>
          )}
        </div>
      </div>
    </div>
  );
};
