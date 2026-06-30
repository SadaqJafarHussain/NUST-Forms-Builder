"use client";

import { useTranslate } from "@tolgee/react";
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { templates } from "@/app/lib/templates";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { createSurveyAction } from "@/modules/survey/components/template-list/actions";

interface TemplateGalleryModalProps {
  open: boolean;
  onClose: () => void;
  environmentId: string;
  userId: string;
}

interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  savedAt: string;
  preset: {
    name: string;
    welcomeCard: any;
    questions: any[];
    endings: any[];
    hiddenFields: any;
  };
}

// Curated NUST-relevant categories with template indices from templates(t) array
const NUST_CATEGORIES = [
  {
    id: "satisfaction",
    label: "استبيانات الرضا والجودة",
    color: "#16a34a",
    bg: "#f0fdf4",
    ring: "#bbf7d0",
    indices: [22, 23, 6, 29],
    arabicNames: [
      "مؤشر ترشيح الخدمة (NPS)",
      "رضا المستخدمين (CSAT)",
      "تقييم سهولة الاستخدام",
      "مؤشر جهد المستخدم (CES)",
    ],
    arabicDescs: [
      "قيّم احتمالية توصية المستخدمين بالخدمة للآخرين",
      "اقيس رضا المستخدمين عن خدمتك أو منتجك بشكل مباشر",
      "اكتشف مدى سهولة استخدام نظامك أو واجهتك",
      "اقيس مدى سهولة إتمام المستخدمين لمهامهم",
    ],
  },
  {
    id: "employees",
    label: "استبيانات الموظفين",
    color: "#1b335f",
    bg: "#eef2f9",
    ring: "#c7d4e8",
    indices: [40, 41, 48, 47, 45, 44],
    arabicNames: [
      "رضا الموظفين",
      "رفاهية الموظف",
      "التطوير الوظيفي",
      "التطوير المهني",
      "التقدير والمكافأة",
      "التوافق والمشاركة",
    ],
    arabicDescs: [
      "اقيس مستوى رضا موظفيك عن بيئة العمل",
      "استطلع رأي الموظفين حول صحتهم وتوازن حياتهم المهنية",
      "افهم تطلعات الموظفين في مسيرتهم المهنية",
      "قيّم احتياجات الموظفين للتدريب والتطوير المهني",
      "اكتشف تفضيلات الموظفين حول برامج التقدير والمكافآت",
      "قيّم مستوى التوافق مع أهداف الجامعة",
    ],
  },
  {
    id: "feedback",
    label: "ملاحظات ومقترحات",
    color: "#7c3aed",
    bg: "#faf5ff",
    ring: "#ddd6fe",
    indices: [18, 24, 21, 8],
    arabicNames: ["صندوق الملاحظات", "جمع المقترحات", "تقييم المحتوى", "طلب تقييم"],
    arabicDescs: [
      "أنشئ قناة دائمة لاستقبال ملاحظات المستخدمين",
      "اجمع آراء ومقترحات المستخدمين حول خدماتك",
      "اقيس جودة المحتوى الذي تقدمه لجمهورك",
      "شجّع المستخدمين على مشاركة تقييماتهم",
    ],
  },
  {
    id: "planning",
    label: "تطوير وتخطيط",
    color: "#d97706",
    bg: "#fffbeb",
    ring: "#fde68a",
    indices: [35, 26, 38, 2],
    arabicNames: ["خارطة طريق المنتج", "أولويات التطوير", "تقييم الأفكار الجديدة", "ملاءمة المنتج للسوق"],
    arabicDescs: [
      "اجمع آراء المستخدمين لبناء خارطة طريق مدروسة",
      "حدد أولويات الميزات التي يريدها مستخدموك فعلاً",
      "قيّم أفكارك الجديدة قبل البدء في تطويرها",
      "اقيس مدى توافق منتجك مع احتياجات السوق",
    ],
  },
];

export const TemplateGalleryModal = ({ open, onClose, environmentId, userId }: TemplateGalleryModalProps) => {
  const { t } = useTranslate();
  const router = useRouter();
  const [loadingIdx, setLoadingIdx] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);

  useEffect(() => {
    if (open) {
      try {
        const stored = localStorage.getItem("nust_custom_templates");
        if (stored) setCustomTemplates(JSON.parse(stored));
      } catch (_) {}
    }
  }, [open]);

  const allTemplates = templates(t);

  const handleUseTemplate = async (templateIdx: number, templateKey: string) => {
    const template = allTemplates[templateIdx];
    if (!template) return;
    setLoadingIdx(templateKey);
    const result = await createSurveyAction({
      environmentId,
      surveyBody: { ...template.preset, type: "link", createdBy: userId } as any,
    });
    if (result?.data) {
      onClose();
      router.push(`/environments/${environmentId}/surveys/${result.data.id}/edit`);
    } else {
      toast.error(getFormattedErrorMessage(result));
      setLoadingIdx(null);
    }
  };

  const handleUseCustomTemplate = async (ct: CustomTemplate) => {
    setLoadingIdx(ct.id);
    const result = await createSurveyAction({
      environmentId,
      surveyBody: { ...ct.preset, type: "link", createdBy: userId } as any,
    });
    if (result?.data) {
      onClose();
      router.push(`/environments/${environmentId}/surveys/${result.data.id}/edit`);
    } else {
      toast.error(getFormattedErrorMessage(result));
      setLoadingIdx(null);
    }
  };

  const handleDeleteCustomTemplate = (id: string) => {
    const updated = customTemplates.filter((ct) => ct.id !== id);
    setCustomTemplates(updated);
    localStorage.setItem("nust_custom_templates", JSON.stringify(updated));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ backgroundColor: "#f0f4f8" }}
      dir="rtl">
      {/* Header */}
      <div
        className="flex flex-shrink-0 items-center justify-between px-8 py-4 shadow-sm"
        style={{ backgroundColor: "#1b335f" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white">
            <XIcon className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">معرض القوالب</h1>
            <p className="text-xs text-white/60">اختر قالباً لبدء فورمك الجديد</p>
          </div>
        </div>
        <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: "#f4bf00" }} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        {/* Custom saved templates */}
        {customTemplates.length > 0 && (
          <div className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: "#f4bf00" }}>
                <span className="text-sm">★</span>
              </div>
              <h2 className="text-lg font-bold" style={{ color: "#1b335f" }}>
                قوالبي المحفوظة
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {customTemplates.map((ct) => (
                <div
                  key={ct.id}
                  className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-md"
                  style={{ border: "1px solid #e2e8f0" }}>
                  <div
                    className="h-20 w-full"
                    style={{ background: `linear-gradient(135deg, #f4bf00, #d97706)` }}
                  />
                  <button
                    onClick={() => handleDeleteCustomTemplate(ct.id)}
                    className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
                    title="حذف">
                    <XIcon className="h-3 w-3" />
                  </button>
                  <div className="p-3">
                    <p className="mb-1 line-clamp-1 text-sm font-semibold text-slate-800">{ct.name}</p>
                    <p className="mb-2 line-clamp-2 text-xs text-slate-400">
                      {ct.description || "قالب مخصص"}
                    </p>
                    <button
                      onClick={() => handleUseCustomTemplate(ct)}
                      disabled={loadingIdx === ct.id}
                      className="w-full rounded-lg py-1 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: "#f4bf00", color: "#1b335f" }}>
                      {loadingIdx === ct.id ? "..." : "استخدام"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-slate-200" />
          </div>
        )}

        {/* Built-in categories */}
        {NUST_CATEGORIES.map((cat) => (
          <div key={cat.id} className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: cat.color }}>
                {cat.label.charAt(0)}
              </div>
              <h2 className="text-lg font-bold" style={{ color: "#1b335f" }}>
                {cat.label}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {cat.indices.map((templateIdx, i) => {
                const key = `${cat.id}-${i}`;
                const name = cat.arabicNames[i] ?? allTemplates[templateIdx]?.name ?? "";
                const desc = cat.arabicDescs[i] ?? allTemplates[templateIdx]?.description ?? "";
                return (
                  <div
                    key={key}
                    className="overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-md"
                    style={{ border: `1px solid #e2e8f0` }}>
                    {/* Colored header */}
                    <div
                      className="flex h-24 w-full items-end px-3 pb-2"
                      style={{ background: `linear-gradient(135deg, ${cat.color}dd, ${cat.color}88)` }}>
                      <p className="text-sm font-bold leading-tight text-white drop-shadow">{name}</p>
                    </div>
                    {/* Body */}
                    <div className="p-3">
                      <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{desc}</p>
                      <button
                        onClick={() => handleUseTemplate(templateIdx, key)}
                        disabled={loadingIdx === key}
                        className="w-full rounded-lg py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: cat.color }}>
                        {loadingIdx === key ? "..." : "استخدام هذا القالب"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
