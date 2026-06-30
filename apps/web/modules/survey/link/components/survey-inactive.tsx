import { Project } from "@prisma/client";
import Image from "next/image";
import { TBannerConfig, TSurveyClosedMessage } from "@formbricks/types/surveys/types";
import { BannerRenderer } from "@/modules/ui/components/banner-renderer";

const STATUS_CONFIG = {
  paused: {
    icon: "⏸",
    iconBg: "#f4bf0020",
    iconColor: "#f4bf00",
    title: "الفورم متوقف مؤقتاً",
    subtitle: "هذا الفورم معلّق حالياً ولا يقبل ردوداً جديدة. يرجى المحاولة لاحقاً.",
    badgeText: "موقوف مؤقتاً",
    badgeBg: "#f4bf0018",
    badgeColor: "#a16207",
    badgeBorder: "#f4bf0040",
  },
  completed: {
    icon: "✓",
    iconBg: "#16a34a18",
    iconColor: "#16a34a",
    title: "شكراً لاهتمامك",
    subtitle: "انتهت فترة جمع البيانات لهذا الفورم. نقدر مشاركتك واهتمامك.",
    badgeText: "مغلق",
    badgeBg: "#16a34a18",
    badgeColor: "#15803d",
    badgeBorder: "#16a34a40",
  },
  "link invalid": {
    icon: "✕",
    iconBg: "#dc262618",
    iconColor: "#dc2626",
    title: "الرابط غير صالح",
    subtitle: "هذا الرابط غير صحيح أو لم يعد متاحاً. يرجى التحقق من الرابط والمحاولة مرة أخرى.",
    badgeText: "رابط غير صالح",
    badgeBg: "#dc262618",
    badgeColor: "#dc2626",
    badgeBorder: "#dc262640",
  },
  "response submitted": {
    icon: "✓",
    iconBg: "#16a34a18",
    iconColor: "#16a34a",
    title: "تم إرسال إجابتك",
    subtitle: "شكراً جزيلاً على مشاركتك. تم تسجيل ردك بنجاح.",
    badgeText: "تم الإرسال",
    badgeBg: "#16a34a18",
    badgeColor: "#15803d",
    badgeBorder: "#16a34a40",
  },
  "link expired": {
    icon: "⏰",
    iconBg: "#f59e0b18",
    iconColor: "#f59e0b",
    title: "انتهت صلاحية الرابط",
    subtitle: "هذا الرابط لم يعد صالحاً. يرجى التواصل مع جهة الإصدار للحصول على رابط جديد.",
    badgeText: "منتهي الصلاحية",
    badgeBg: "#f59e0b18",
    badgeColor: "#b45309",
    badgeBorder: "#f59e0b40",
  },
};

export const SurveyInactive = async ({
  status,
  surveyClosedMessage,
  bannerConfig,
}: {
  status: "paused" | "completed" | "link invalid" | "response submitted" | "link expired";
  surveyClosedMessage?: TSurveyClosedMessage | null;
  project?: Pick<Project, "linkSurveyBranding">;
  bannerConfig?: TBannerConfig | null;
}) => {
  const cfg = STATUS_CONFIG[status];
  const hasCustomMessage = (status === "completed" || status === "link expired") && surveyClosedMessage;

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#f0f4f8" }} dir="rtl">
      {/* Banner */}
      {bannerConfig ? (
        <BannerRenderer config={bannerConfig} />
      ) : (
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
                  <Image
                    src="/images/logo.png"
                    alt="شعار الجامعة"
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                    priority
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
                  <Image
                    src="/images/logo.png"
                    alt="شعار الجامعة"
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                    priority
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
      )}

      {/* Status Card */}
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-lg rounded-2xl bg-white text-center shadow-lg"
          style={{ border: "1px solid #e2e8f0" }}>
          {/* Navy top accent */}
          <div className="h-1.5 w-full rounded-t-2xl" style={{ backgroundColor: "#1b335f" }} />

          <div className="px-8 py-10">
            {/* Status icon */}
            <div
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full text-5xl font-bold"
              style={{
                backgroundColor: cfg.iconBg,
                color: cfg.iconColor,
                border: `2px solid ${cfg.iconColor}30`,
              }}>
              {cfg.icon}
            </div>

            {/* Status badge */}
            <span
              className="mb-5 inline-block rounded-full px-4 py-1 text-sm font-semibold"
              style={{
                backgroundColor: cfg.badgeBg,
                color: cfg.badgeColor,
                border: `1px solid ${cfg.badgeBorder}`,
              }}>
              {cfg.badgeText}
            </span>

            {/* Title */}
            <h1 className="mb-3 text-2xl font-bold" style={{ color: "#1b335f" }}>
              {hasCustomMessage ? surveyClosedMessage!.heading : cfg.title}
            </h1>

            {/* Subtitle */}
            <p className="text-base leading-relaxed text-slate-500">
              {hasCustomMessage ? surveyClosedMessage!.subheading : cfg.subtitle}
            </p>

            {/* Gold divider */}
            <div className="mx-auto my-8 h-0.5 w-16 rounded-full" style={{ backgroundColor: "#f4bf00" }} />

            {/* Footer note */}
            <p className="text-xs text-slate-400">
              نظام الاستبيانات الإلكتروني — الجامعة الوطنية للعلوم والتكنولوجيا
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
