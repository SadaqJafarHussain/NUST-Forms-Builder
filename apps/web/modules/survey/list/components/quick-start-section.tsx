"use client";

import { useTranslate } from "@tolgee/react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { templates } from "@/app/lib/templates";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { createSurveyAction } from "@/modules/survey/components/template-list/actions";
import { TemplateGalleryModal } from "./template-gallery-modal";

interface QuickStartSectionProps {
  environmentId: string;
  userId: string;
}

// 4 featured slots — each maps to a real template index in templates(t)
// and defines the card visual style
const FEATURED = [
  {
    idx: 22, // nps
    nameAr: "مؤشر ترشيح الخدمة",
    from: "#2e7bb5",
    to: "#1a5f8a",
    svg: (
      <svg
        viewBox="0 0 200 140"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice">
        <rect x="30" y="20" width="140" height="100" rx="6" fill="white" fillOpacity="0.15" />
        <rect x="45" y="35" width="80" height="7" rx="3" fill="white" fillOpacity="0.6" />
        <rect x="45" y="52" width="110" height="5" rx="2.5" fill="white" fillOpacity="0.35" />
        <rect x="45" y="66" width="90" height="5" rx="2.5" fill="white" fillOpacity="0.35" />
        <rect x="45" y="80" width="100" height="5" rx="2.5" fill="white" fillOpacity="0.35" />
        <rect x="45" y="94" width="70" height="5" rx="2.5" fill="white" fillOpacity="0.25" />
      </svg>
    ),
  },
  {
    idx: 40, // employee satisfaction
    nameAr: "رضا الموظفين",
    from: "#c95eaa",
    to: "#8e3591",
    svg: (
      <svg
        viewBox="0 0 200 140"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice">
        <rect x="30" y="20" width="140" height="100" rx="6" fill="white" fillOpacity="0.15" />
        <circle cx="55" cy="52" r="8" fill="white" fillOpacity="0.5" />
        <path d="M51 52 L54 55 L59 49" stroke="#16a34a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <rect x="72" y="48" width="72" height="7" rx="3" fill="white" fillOpacity="0.5" />
        <circle cx="55" cy="78" r="8" fill="white" fillOpacity="0.5" />
        <path d="M51 78 L55 82 L59 74" stroke="#dc2626" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <rect x="72" y="74" width="55" height="7" rx="3" fill="white" fillOpacity="0.35" />
        <rect x="30" y="104" width="140" height="7" rx="3" fill="#f4bf00" fillOpacity="0.6" />
      </svg>
    ),
  },
  {
    idx: 18, // feedbackBox
    nameAr: "صندوق الملاحظات",
    from: "#c0705a",
    to: "#a04a3a",
    svg: (
      <svg
        viewBox="0 0 200 140"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice">
        <ellipse cx="140" cy="90" rx="55" ry="55" fill="white" fillOpacity="0.1" />
        <rect x="28" y="22" width="100" height="96" rx="6" fill="white" fillOpacity="0.18" />
        <rect x="38" y="38" width="60" height="7" rx="3" fill="white" fillOpacity="0.5" />
        <rect x="38" y="54" width="80" height="5" rx="2.5" fill="white" fillOpacity="0.35" />
        <rect x="38" y="67" width="70" height="5" rx="2.5" fill="white" fillOpacity="0.35" />
        <rect x="38" y="80" width="75" height="5" rx="2.5" fill="white" fillOpacity="0.25" />
        <rect x="38" y="97" width="55" height="12" rx="4" fill="white" fillOpacity="0.4" />
      </svg>
    ),
  },
  {
    idx: 48, // career development
    nameAr: "التطوير الوظيفي",
    from: "#d47b2e",
    to: "#b55e1a",
    svg: (
      <svg
        viewBox="0 0 200 140"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice">
        <rect x="18" y="18" width="120" height="90" rx="8" fill="white" fillOpacity="0.18" />
        <rect x="28" y="32" width="70" height="7" rx="3" fill="white" fillOpacity="0.5" />
        <rect x="28" y="48" width="90" height="5" rx="2.5" fill="white" fillOpacity="0.35" />
        <rect x="28" y="61" width="80" height="5" rx="2.5" fill="white" fillOpacity="0.3" />
        <rect x="28" y="74" width="95" height="5" rx="2.5" fill="white" fillOpacity="0.25" />
        <polygon points="18,108 38,88 38,108" fill="white" fillOpacity="0.4" />
        <rect x="95" y="52" width="90" height="72" rx="8" fill="white" fillOpacity="0.13" />
        <rect x="105" y="66" width="60" height="5" rx="2.5" fill="white" fillOpacity="0.4" />
        <rect x="105" y="79" width="68" height="5" rx="2.5" fill="white" fillOpacity="0.3" />
        <rect x="105" y="92" width="50" height="5" rx="2.5" fill="white" fillOpacity="0.25" />
      </svg>
    ),
  },
];

const HIDE_KEY = "nust_hide_templates";

export const QuickStartSection = ({ environmentId, userId }: QuickStartSectionProps) => {
  const { t } = useTranslate();
  const router = useRouter();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [hidden, setHidden] = useState(false);

  const allTemplates = templates(t);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(HIDE_KEY) === "1");
    } catch (_) {}
  }, []);

  const toggleHide = () => {
    const next = !hidden;
    setHidden(next);
    localStorage.setItem(HIDE_KEY, next ? "1" : "0");
  };

  const handleUseTemplate = async (templateIdx: number, key: string) => {
    const template = allTemplates[templateIdx];
    if (!template) return;
    setLoadingKey(key);
    const result = await createSurveyAction({
      environmentId,
      surveyBody: { ...template.preset, type: "link", createdBy: userId } as any,
    });
    if (result?.data) {
      router.push(`/environments/${environmentId}/surveys/${result.data.id}/edit`);
    } else {
      toast.error(getFormattedErrorMessage(result));
      setLoadingKey(null);
    }
  };

  return (
    <>
      <div className="mb-6" dir="rtl">
        {/* Section header */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-600">استكشف القوالب</p>
          <button
            onClick={toggleHide}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
            {hidden ? (
              <>
                <ChevronDownIcon className="h-3.5 w-3.5" />
                إظهار القوالب
              </>
            ) : (
              <>
                <ChevronUpIcon className="h-3.5 w-3.5" />
                إخفاء القوالب
              </>
            )}
          </button>
        </div>

        {!hidden && (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
            {/* 4 real template cards */}
            {FEATURED.map((f) => (
              <button
                key={f.idx}
                onClick={() => handleUseTemplate(f.idx, String(f.idx))}
                disabled={loadingKey !== null}
                className="group relative overflow-hidden rounded-2xl text-center transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
                style={{
                  height: 160,
                  background: `linear-gradient(160deg, ${f.from}, ${f.to})`,
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}>
                {/* Decorative illustration */}
                <div className="absolute inset-0">{f.svg}</div>

                {/* Loading spinner */}
                {loadingKey === String(f.idx) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <svg className="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  </div>
                )}

                {/* Label */}
                <span className="relative z-10 text-base font-bold text-white drop-shadow">{f.nameAr}</span>
              </button>
            ))}

            {/* Template Gallery card */}
            <button
              onClick={() => setShowGallery(true)}
              className="group relative overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                height: 160,
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative" style={{ width: 120, height: 90 }}>
                  <div
                    className="absolute rounded-xl"
                    style={{
                      width: 90,
                      height: 64,
                      top: 16,
                      right: 0,
                      background: "linear-gradient(135deg,#c95eaa,#8e3591)",
                      transform: "rotate(7deg)",
                      opacity: 0.55,
                    }}
                  />
                  <div
                    className="absolute rounded-xl"
                    style={{
                      width: 90,
                      height: 64,
                      top: 8,
                      right: 10,
                      background: "linear-gradient(135deg,#c0705a,#a04a3a)",
                      transform: "rotate(3deg)",
                      opacity: 0.65,
                    }}
                  />
                  <div
                    className="absolute rounded-xl"
                    style={{
                      width: 90,
                      height: 64,
                      top: 0,
                      right: 20,
                      background: "linear-gradient(135deg,#2e7bb5,#1a5f8a)",
                    }}
                  />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 px-4 pb-3 text-center">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-[#1b335f]">
                  معرض القوالب →
                </p>
              </div>
            </button>
          </div>
        )}
      </div>

      <TemplateGalleryModal
        open={showGallery}
        onClose={() => setShowGallery(false)}
        environmentId={environmentId}
        userId={userId}
      />
    </>
  );
};
