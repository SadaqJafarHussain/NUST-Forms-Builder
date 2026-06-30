"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useTranslate } from "@tolgee/react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileSpreadsheetIcon,
  MapPinIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { type JSX, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { TSurvey, TSurveyIraqLocationQuestion } from "@formbricks/types/surveys/types";
import { TUserLocale } from "@formbricks/types/user";
import { createI18nString, extractLanguageCodes } from "@/lib/i18n/utils";
import { QuestionFormInput } from "@/modules/survey/components/question-form-input";
import { Button } from "@/modules/ui/components/button";

// ── Static built-in location data (imported at build-time) ──────────────────
// We need just the raw data for the province filter UI.
// Using a lazy dynamic import would be complex; instead we import the types
// and cast the built-in JSON (already bundled in @formbricks/surveys).
// For the editor, we only need province names — so we keep a lightweight list
// rather than importing all 1 MB of areas.
const BUILTIN_PROVINCES: { province_id: number; المحافظة: string }[] = [
  { province_id: 1, المحافظة: "نينوى" },
  { province_id: 2, المحافظة: "صلاح الدين" },
  { province_id: 3, المحافظة: "ديالى" },
  { province_id: 4, المحافظة: "الأنبار" },
  { province_id: 5, المحافظة: "كركوك" },
  { province_id: 6, المحافظة: "بغداد" },
  { province_id: 7, المحافظة: "واسط" },
  { province_id: 8, المحافظة: "ميسان" },
  { province_id: 9, المحافظة: "البصرة" },
  { province_id: 10, المحافظة: "ذي قار" },
  { province_id: 11, المحافظة: "المثنى" },
  { province_id: 12, المحافظة: "القادسية" },
  { province_id: 13, المحافظة: "النجف" },
  { province_id: 14, المحافظة: "كربلاء" },
  { province_id: 15, المحافظة: "بابل" },
  { province_id: 16, المحافظة: "الديوانية" },
  { province_id: 17, المحافظة: "السليمانية" },
  { province_id: 18, المحافظة: "أربيل" },
  { province_id: 19, المحافظة: "دهوك" },
  { province_id: 20, المحافظة: "حلبجة" },
];

interface IraqLocationQuestionFormProps {
  localSurvey: TSurvey;
  question: TSurveyIraqLocationQuestion;
  questionIdx: number;
  updateQuestion: (questionIdx: number, updatedAttributes: Partial<TSurveyIraqLocationQuestion>) => void;
  isInvalid: boolean;
  selectedLanguageCode: string;
  setSelectedLanguageCode: (language: string) => void;
  locale: TUserLocale;
  isStorageConfigured: boolean;
}

// ── Small helpers ────────────────────────────────────────────────────────────

const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) => (
  <label
    className="grid w-full cursor-pointer select-none items-center gap-3"
    style={{ gridTemplateColumns: "auto 1fr" }}>
    {/* Force LTR on the button so the knob always starts from the left edge */}
    <button
      type="button"
      dir="ltr"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none"
      style={{ backgroundColor: checked ? "#1b335f" : "#cbd5e1" }}>
      <span
        className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform"
        style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
    <span className="text-sm font-medium text-slate-700">{label}</span>
  </label>
);

// ── Province filter checkbox list ────────────────────────────────────────────

const ProvinceFilter = ({
  enabledIds,
  onChange,
}: {
  enabledIds: number[] | null | undefined;
  onChange: (ids: number[] | null) => void;
}) => {
  // null/undefined = all provinces shown
  const selected = new Set(enabledIds ?? BUILTIN_PROVINCES.map((p) => p.province_id));
  const allSelected = !enabledIds || enabledIds.length === BUILTIN_PROVINCES.length;

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) {
      // Prevent deselecting the last province — a form with 0 provinces is broken
      if (next.size <= 1) return;
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(next.size === BUILTIN_PROVINCES.length ? null : Array.from(next));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">اختر المحافظات التي تظهر للمستجيب</span>
        {!allSelected && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-[#1b335f] underline hover:no-underline">
            تحديد الكل
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
        {BUILTIN_PROVINCES.map((p) => {
          const checked = selected.has(p.province_id);
          return (
            <label
              key={p.province_id}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition hover:bg-white"
              style={{ fontWeight: checked ? 600 : 400, color: checked ? "#1b335f" : "#64748b" }}>
              <span
                className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition"
                style={{
                  borderColor: checked ? "#1b335f" : "#cbd5e1",
                  backgroundColor: checked ? "#1b335f" : "#fff",
                }}>
                {checked && <CheckIcon className="h-3 w-3 text-white" strokeWidth={3} />}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => toggle(p.province_id)}
              />
              {p.المحافظة}
            </label>
          );
        })}
      </div>
    </div>
  );
};

// ── Custom data editor ───────────────────────────────────────────────────────

type TabId = "provinces" | "judiciaries" | "areas";

const CustomDataEditor = ({
  customData,
  onChange,
  onReset,
}: {
  customData: TSurveyIraqLocationQuestion["customData"];
  onChange: (data: TSurveyIraqLocationQuestion["customData"]) => void;
  onReset: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("provinces");
  const [newProv, setNewProv] = useState({ ar: "", en: "" });
  const [newJud, setNewJud] = useState({ ar: "", en: "", provinceId: "" });
  const [newArea, setNewArea] = useState({ ar: "", en: "", provinceId: "", districtId: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const data = customData ?? { provinces: [], judiciaries: [], areas: [] };

  const update = (patch: Partial<typeof data>) => onChange({ ...data, ...patch });

  // ── Province ops ──────────────────────────────────────────────────────────
  const addProvince = () => {
    if (!newProv.ar.trim()) return;
    const maxId = Math.max(0, ...data.provinces.map((p) => p.province_id));
    update({
      provinces: [
        ...data.provinces,
        {
          province_id: maxId + 1,
          المحافظة: newProv.ar.trim(),
          province: newProv.en.trim() || newProv.ar.trim(),
          country_id: 0,
        },
      ],
    });
    setNewProv({ ar: "", en: "" });
  };

  const deleteProvince = (id: number) => {
    update({
      provinces: data.provinces.filter((p) => p.province_id !== id),
      judiciaries: data.judiciaries.filter((j) => j.province_id !== id),
      areas: data.areas.filter((a) => a.province_id !== id),
    });
  };

  // ── Judiciary ops ─────────────────────────────────────────────────────────
  const addJudiciary = () => {
    if (!newJud.ar.trim() || !newJud.provinceId) return;
    const maxId = Math.max(0, ...data.judiciaries.map((j) => j.district_ID));
    update({
      judiciaries: [
        ...data.judiciaries,
        {
          district_ID: maxId + 1,
          province_id: Number(newJud.provinceId),
          "المدينة او القضاء": newJud.ar.trim(),
          "The city or The judiciary ": newJud.en.trim() || newJud.ar.trim(),
        },
      ],
    });
    setNewJud({ ar: "", en: "", provinceId: newJud.provinceId });
  };

  const deleteJudiciary = (id: number) => {
    update({
      judiciaries: data.judiciaries.filter((j) => j.district_ID !== id),
      areas: data.areas.filter((a) => a.district_ID !== id),
    });
  };

  // ── Area ops ──────────────────────────────────────────────────────────────
  const addArea = () => {
    if (!newArea.ar.trim() || !newArea.provinceId || !newArea.districtId) return;
    const maxId = Math.max(0, ...data.areas.map((a) => a.Neighbor_ID));
    update({
      areas: [
        ...data.areas,
        {
          Neighbor_ID: maxId + 1,
          province_id: Number(newArea.provinceId),
          district_ID: Number(newArea.districtId),
          "المنطقة او الحي": newArea.ar.trim(),
          "The Area or The Neighborhood": newArea.en.trim() || newArea.ar.trim(),
          province: "",
          "Unnamed: 0": null,
        },
      ],
    });
    setNewArea({ ar: "", en: "", provinceId: newArea.provinceId, districtId: newArea.districtId });
  };

  const deleteArea = (id: number) => {
    update({ areas: data.areas.filter((a) => a.Neighbor_ID !== id) });
  };

  // ── Excel import ──────────────────────────────────────────────────────────
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "array" });
        const newData: typeof data = { provinces: [], judiciaries: [], areas: [] };

        // Sheet 1: المحافظات — columns: province_id, المحافظة, province
        const provSheet = wb.Sheets[wb.SheetNames[0]];
        if (provSheet) {
          const rows: any[] = XLSX.utils.sheet_to_json(provSheet);
          rows.forEach((r) => {
            const id = Number(r["province_id"] ?? r["رقم"]);
            const ar = String(r["المحافظة"] ?? r["ar"] ?? "").trim();
            if (!id || !ar) return;
            newData.provinces.push({
              province_id: id,
              المحافظة: ar,
              province: String(r["province"] ?? ar),
              country_id: 0,
            });
          });
        }

        // Sheet 2: الأقضية — columns: district_ID, province_id, المدينة او القضاء, The city or The judiciary
        if (wb.SheetNames[1]) {
          const judSheet = wb.Sheets[wb.SheetNames[1]];
          const rows: any[] = XLSX.utils.sheet_to_json(judSheet);
          rows.forEach((r) => {
            const id = Number(r["district_ID"] ?? r["رقم"]);
            const pid = Number(r["province_id"] ?? r["رقم_المحافظة"]);
            const ar = String(r["المدينة او القضاء"] ?? r["ar"] ?? "").trim();
            if (!id || !pid || !ar) return;
            newData.judiciaries.push({
              district_ID: id,
              province_id: pid,
              "المدينة او القضاء": ar,
              "The city or The judiciary ": String(r["The city or The judiciary "] ?? ar),
            });
          });
        }

        // Sheet 3: المناطق — columns: Neighbor_ID, province_id, district_ID, المنطقة او الحي, The Area or The Neighborhood
        if (wb.SheetNames[2]) {
          const areaSheet = wb.Sheets[wb.SheetNames[2]];
          const rows: any[] = XLSX.utils.sheet_to_json(areaSheet);
          rows.forEach((r) => {
            const id = Number(r["Neighbor_ID"] ?? r["رقم"]);
            const pid = Number(r["province_id"] ?? r["رقم_المحافظة"]);
            const did = Number(r["district_ID"] ?? r["رقم_القضاء"]);
            const ar = String(r["المنطقة او الحي"] ?? r["ar"] ?? "").trim();
            if (!id || !pid || !did || !ar) return;
            newData.areas.push({
              Neighbor_ID: id,
              province_id: pid,
              district_ID: did,
              "المنطقة او الحي": ar,
              "The Area or The Neighborhood": String(r["The Area or The Neighborhood"] ?? ar),
              province: "",
              "Unnamed: 0": null,
            });
          });
        }

        onChange(newData);
      } catch (err) {
        alert("فشل في قراءة الملف. تأكد من تنسيق Excel الصحيح.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const TABS: { id: TabId; label: string; count: number }[] = [
    { id: "provinces", label: "المحافظات", count: data.provinces.length },
    { id: "judiciaries", label: "الأقضية", count: data.judiciaries.length },
    { id: "areas", label: "المناطق", count: data.areas.length },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-xl border-b border-slate-100 bg-slate-50 px-4 py-3">
        <span className="text-sm font-semibold text-slate-700">محرر البيانات المخصصة</span>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleExcelImport}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#1b335f] hover:text-[#1b335f]">
            <FileSpreadsheetIcon className="h-3.5 w-3.5" />
            استيراد Excel
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-100">
            <XIcon className="h-3.5 w-3.5" />
            استعادة الافتراضي
          </button>
        </div>
      </div>

      {/* Excel format hint */}
      <div className="border-b border-slate-100 bg-amber-50 px-4 py-2 text-xs text-amber-700">
        <strong>تنسيق Excel:</strong> ورقة 1 = المحافظات (province_id, المحافظة)، ورقة 2 = الأقضية
        (district_ID, province_id, المدينة او القضاء)، ورقة 3 = المناطق (Neighbor_ID, province_id,
        district_ID, المنطقة او الحي)
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition"
            style={{
              borderBottom: activeTab === tab.id ? "2px solid #1b335f" : "2px solid transparent",
              color: activeTab === tab.id ? "#1b335f" : "#64748b",
            }}>
            {tab.label}
            <span
              className="rounded-full px-1.5 py-0.5 text-xs"
              style={{
                backgroundColor: activeTab === tab.id ? "#1b335f18" : "#f1f5f9",
                color: activeTab === tab.id ? "#1b335f" : "#94a3b8",
              }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Provinces tab */}
        {activeTab === "provinces" && (
          <div className="space-y-2">
            <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-100">
              {data.provinces.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-400">
                  لا توجد محافظات — أضف يدوياً أو استورد من Excel
                </p>
              ) : (
                data.provinces.map((p) => (
                  <div
                    key={p.province_id}
                    className="flex items-center justify-between border-b border-slate-50 px-3 py-2 last:border-0 hover:bg-slate-50">
                    <span className="text-sm text-slate-700">
                      <span className="ml-2 text-xs text-slate-400">#{p.province_id}</span>
                      {p.المحافظة}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteProvince(p.province_id)}
                      className="rounded p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-400">
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newProv.ar}
                onChange={(e) => setNewProv((v) => ({ ...v, ar: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addProvince()}
                placeholder="اسم المحافظة بالعربية *"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1b335f] focus:outline-none"
              />
              <input
                type="text"
                value={newProv.en}
                onChange={(e) => setNewProv((v) => ({ ...v, en: e.target.value }))}
                placeholder="بالإنجليزية (اختياري)"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1b335f] focus:outline-none"
              />
              <button
                type="button"
                onClick={addProvince}
                className="rounded-lg px-3 py-2 text-white transition"
                style={{ backgroundColor: "#1b335f" }}>
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Judiciaries tab */}
        {activeTab === "judiciaries" && (
          <div className="space-y-2">
            <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-100">
              {data.judiciaries.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-400">لا توجد أقضية</p>
              ) : (
                data.judiciaries.map((j) => {
                  const prov = data.provinces.find((p) => p.province_id === j.province_id);
                  return (
                    <div
                      key={j.district_ID}
                      className="flex items-center justify-between border-b border-slate-50 px-3 py-2 last:border-0 hover:bg-slate-50">
                      <span className="text-sm text-slate-700">
                        <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                          {prov?.المحافظة ?? `#${j.province_id}`}
                        </span>
                        {j["المدينة او القضاء"]}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteJudiciary(j.district_ID)}
                        className="rounded p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-400">
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={newJud.provinceId}
                onChange={(e) => setNewJud((v) => ({ ...v, provinceId: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1b335f] focus:outline-none">
                <option value="">المحافظة *</option>
                {data.provinces.map((p) => (
                  <option key={p.province_id} value={p.province_id}>
                    {p.المحافظة}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newJud.ar}
                onChange={(e) => setNewJud((v) => ({ ...v, ar: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addJudiciary()}
                placeholder="اسم القضاء بالعربية *"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1b335f] focus:outline-none"
              />
              <button
                type="button"
                onClick={addJudiciary}
                className="rounded-lg px-3 py-2 text-white transition"
                style={{ backgroundColor: "#1b335f" }}>
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Areas tab */}
        {activeTab === "areas" && (
          <div className="space-y-2">
            <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-100">
              {data.areas.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-400">لا توجد مناطق</p>
              ) : (
                data.areas.map((a) => {
                  const prov = data.provinces.find((p) => p.province_id === a.province_id);
                  const jud = data.judiciaries.find((j) => j.district_ID === a.district_ID);
                  return (
                    <div
                      key={a.Neighbor_ID}
                      className="flex items-center justify-between border-b border-slate-50 px-3 py-2 last:border-0 hover:bg-slate-50">
                      <span className="text-sm text-slate-700">
                        <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                          {prov?.المحافظة ?? `#${a.province_id}`} /{" "}
                          {jud?.["المدينة او القضاء"] ?? `#${a.district_ID}`}
                        </span>
                        {a["المنطقة او الحي"]}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteArea(a.Neighbor_ID)}
                        className="rounded p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-400">
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={newArea.provinceId}
                onChange={(e) => setNewArea((v) => ({ ...v, provinceId: e.target.value, districtId: "" }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1b335f] focus:outline-none">
                <option value="">المحافظة *</option>
                {data.provinces.map((p) => (
                  <option key={p.province_id} value={p.province_id}>
                    {p.المحافظة}
                  </option>
                ))}
              </select>
              <select
                value={newArea.districtId}
                onChange={(e) => setNewArea((v) => ({ ...v, districtId: e.target.value }))}
                disabled={!newArea.provinceId}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1b335f] focus:outline-none disabled:opacity-50">
                <option value="">القضاء *</option>
                {data.judiciaries
                  .filter((j) => j.province_id === Number(newArea.provinceId))
                  .map((j) => (
                    <option key={j.district_ID} value={j.district_ID}>
                      {j["المدينة او القضاء"]}
                    </option>
                  ))}
              </select>
              <input
                type="text"
                value={newArea.ar}
                onChange={(e) => setNewArea((v) => ({ ...v, ar: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addArea()}
                placeholder="اسم المنطقة بالعربية *"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1b335f] focus:outline-none"
              />
              <button
                type="button"
                onClick={addArea}
                className="rounded-lg px-3 py-2 text-white transition"
                style={{ backgroundColor: "#1b335f" }}>
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main form ────────────────────────────────────────────────────────────────

export const IraqLocationQuestionForm = ({
  question,
  questionIdx,
  updateQuestion,
  isInvalid,
  localSurvey,
  selectedLanguageCode,
  setSelectedLanguageCode,
  locale,
  isStorageConfigured = true,
}: IraqLocationQuestionFormProps): JSX.Element => {
  const surveyLanguageCodes = extractLanguageCodes(localSurvey.languages ?? []);
  const { t } = useTranslate();
  const [parent] = useAutoAnimate();
  const [showProvinceFilter, setShowProvinceFilter] = useState(false);
  const [showCustomData, setShowCustomData] = useState(false);

  const judiciaryEnabled = question.judiciary?.enabled !== false;
  const areaEnabled = question.area?.enabled !== false;
  const hasCustomData = !!question.customData;

  const setJudiciaryEnabled = (enabled: boolean) => {
    updateQuestion(questionIdx, {
      judiciary: { ...question.judiciary, enabled },
      // if disabling judiciary, also disable area
      area: { ...question.area, enabled: enabled ? areaEnabled : false },
    });
  };

  const setAreaEnabled = (enabled: boolean) => {
    updateQuestion(questionIdx, { area: { ...question.area, enabled } });
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Question title */}
      <QuestionFormInput
        id="headline"
        value={question.headline}
        label={t("environments.surveys.edit.question") + "*"}
        localSurvey={localSurvey}
        questionIdx={questionIdx}
        isInvalid={isInvalid}
        updateQuestion={updateQuestion}
        selectedLanguageCode={selectedLanguageCode}
        setSelectedLanguageCode={setSelectedLanguageCode}
        locale={locale}
        isStorageConfigured={isStorageConfigured}
      />

      <div ref={parent}>
        {question.subheader !== undefined && (
          <div className="inline-flex w-full items-center">
            <div className="w-full">
              <QuestionFormInput
                id="subheader"
                value={question.subheader}
                label={t("common.description")}
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
          </div>
        )}
        {question.subheader === undefined && (
          <Button
            size="sm"
            variant="secondary"
            className="mt-2"
            type="button"
            onClick={() =>
              updateQuestion(questionIdx, { subheader: createI18nString("", surveyLanguageCodes) })
            }>
            <PlusIcon className="mr-1 h-4 w-4" />
            {t("environments.surveys.edit.add_description")}
          </Button>
        )}
      </div>

      {/* ── Level toggles ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <MapPinIcon className="h-4 w-4 text-[#1b335f]" />
          <span className="text-sm font-semibold text-slate-700">مستويات الموقع</span>
        </div>
        <div className="space-y-3">
          {/* Province — always on */}
          <div
            className="grid w-full items-center gap-3 opacity-60"
            style={{ gridTemplateColumns: "auto 1fr" }}>
            {/* Fake "always on" toggle — force LTR so knob is on the right (on state) */}
            <span
              dir="ltr"
              className="inline-flex h-5 w-9 items-center justify-end rounded-full px-0.5"
              style={{ backgroundColor: "#1b335f" }}>
              <span className="h-4 w-4 rounded-full bg-white" />
            </span>
            <span className="text-sm font-medium text-slate-700">
              المحافظة <span className="text-xs text-slate-400">(مطلوب دائماً)</span>
            </span>
          </div>
          <Toggle checked={judiciaryEnabled} onChange={setJudiciaryEnabled} label="القضاء / المدينة" />
          <Toggle
            checked={areaEnabled && judiciaryEnabled}
            onChange={(v) => {
              if (!judiciaryEnabled) return; // can't enable area without judiciary
              setAreaEnabled(v);
            }}
            label={`المنطقة / الحي${!judiciaryEnabled ? " (يتطلب تفعيل القضاء)" : ""}`}
          />
        </div>
        {!judiciaryEnabled && (
          <p className="mt-2 text-xs text-amber-600">
            تعطيل القضاء سيخفي المنطقة أيضاً. المستجيب سيختار المحافظة فقط.
          </p>
        )}
        {judiciaryEnabled && !areaEnabled && (
          <p className="mt-2 text-xs text-slate-400">المستجيب سيختار المحافظة والقضاء فقط.</p>
        )}
      </div>

      {/* ── Data source ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">مصدر بيانات الموقع</span>
          {!hasCustomData && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              البيانات الافتراضية — العراق الكامل
            </span>
          )}
          {hasCustomData && (
            <span className="rounded-full bg-[#1b335f18] px-2 py-0.5 text-xs font-medium text-[#1b335f]">
              بيانات مخصصة
            </span>
          )}
        </div>

        {/* Province filter (only for built-in data) */}
        {!hasCustomData && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setShowProvinceFilter((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition hover:border-[#1b335f]">
              <span className="font-medium text-slate-600">
                تصفية المحافظات المعروضة
                {question.enabledProvinceIds?.length
                  ? ` (${question.enabledProvinceIds.length} من ${BUILTIN_PROVINCES.length})`
                  : " (جميع المحافظات)"}
              </span>
              {showProvinceFilter ? (
                <ChevronDownIcon className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-slate-400" />
              )}
            </button>
            {showProvinceFilter && (
              <div className="mt-2">
                <ProvinceFilter
                  enabledIds={question.enabledProvinceIds}
                  onChange={(ids) => updateQuestion(questionIdx, { enabledProvinceIds: ids })}
                />
              </div>
            )}
          </div>
        )}

        {/* Custom data toggle */}
        <div className="space-y-1">
          <Toggle
            checked={hasCustomData}
            onChange={(v) => {
              if (v) {
                // switch to custom data — start empty
                updateQuestion(questionIdx, {
                  customData: { provinces: [], judiciaries: [], areas: [] },
                  enabledProvinceIds: null,
                });
                setShowCustomData(true);
              } else {
                // back to built-in data
                updateQuestion(questionIdx, { customData: undefined, enabledProvinceIds: null });
                setShowCustomData(false);
              }
            }}
            label="استخدام بيانات مخصصة بدلاً من البيانات الافتراضية"
          />
          {hasCustomData && (
            <button
              type="button"
              onClick={() => setShowCustomData((v) => !v)}
              className="w-full text-right text-xs text-[#1b335f] underline hover:no-underline">
              {showCustomData ? "إخفاء المحرر" : "فتح المحرر"}
            </button>
          )}
        </div>

        {hasCustomData && showCustomData && (
          <div className="mt-3">
            <CustomDataEditor
              customData={question.customData}
              onChange={(d) => updateQuestion(questionIdx, { customData: d })}
              onReset={() => {
                updateQuestion(questionIdx, { customData: undefined, enabledProvinceIds: null });
                setShowCustomData(false);
              }}
            />
          </div>
        )}

        {hasCustomData && !showCustomData && question.customData && (
          <p className="mt-2 text-xs text-slate-500">
            {question.customData.provinces.length} محافظة · {question.customData.judiciaries.length} قضاء ·{" "}
            {question.customData.areas.length} منطقة
          </p>
        )}
      </div>
    </div>
  );
};
