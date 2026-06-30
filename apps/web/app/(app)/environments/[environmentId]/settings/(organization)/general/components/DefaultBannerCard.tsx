"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { TBannerConfig } from "@formbricks/types/surveys/types";
import { BannerDesigner } from "@/modules/survey/editor/components/banner-designer";
import { BannerRenderer } from "@/modules/ui/components/banner-renderer";
import { updateDefaultBannerAction } from "../actions";

interface DefaultBannerCardProps {
  organizationId: string;
  environmentId: string;
  initialBannerConfig: TBannerConfig | null;
}

export const DefaultBannerCard = ({
  organizationId,
  environmentId,
  initialBannerConfig,
}: DefaultBannerCardProps) => {
  const [bannerConfig, setBannerConfig] = useState<TBannerConfig | null>(initialBannerConfig);
  const [saving, setSaving] = useState(false);

  const handleSave = async (config: TBannerConfig) => {
    setSaving(true);
    try {
      await updateDefaultBannerAction({ organizationId, defaultBannerConfig: config });
      setBannerConfig(config);
      toast.success("تم حفظ البانر الافتراضي بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await updateDefaultBannerAction({ organizationId, defaultBannerConfig: null });
      setBannerConfig(null);
      toast.success("تم حذف البانر الافتراضي");
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <div>
        <p className="text-sm text-slate-600">
          يُستخدم هذا البانر تلقائياً في أي نموذج لم يتم تصميم بانر مخصص له. مطلوب لنشر النماذج.
        </p>
      </div>

      {bannerConfig ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <BannerRenderer config={bannerConfig} />
        </div>
      ) : (
        <div
          className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 py-10"
          style={{ backgroundColor: "#f8fafc" }}>
          <p className="text-sm text-slate-400">لم يتم تعيين بانر افتراضي بعد</p>
        </div>
      )}

      <div className="flex gap-2">
        <BannerDesigner
          config={bannerConfig}
          onChange={handleSave}
          environmentId={environmentId}
          trigger={
            <button
              type="button"
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "#1b335f" }}>
              {bannerConfig ? "تعديل البانر الافتراضي" : "تصميم البانر الافتراضي"}
            </button>
          }
        />
        {bannerConfig && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50">
            حذف البانر الافتراضي
          </button>
        )}
      </div>
    </div>
  );
};
