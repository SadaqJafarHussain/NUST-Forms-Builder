"use client";

import Image from "next/image";

interface FormBannerProps {
  surveyTitle?: string;
  projectName?: string;
}

export const FormBanner = ({ surveyTitle, projectName }: FormBannerProps) => {
  return (
    <div dir="rtl" className="w-full" style={{ background: "#1b335f" }}>
      {/* Gold top stripe */}
      <div className="h-2 w-full" style={{ backgroundColor: "#f4bf00" }} />

      {/* Basmala */}
      <p
        className="pt-3 text-center text-sm font-medium"
        style={{ color: "#f4bf00", fontFamily: "serif", letterSpacing: "0.05em" }}>
        بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
      </p>

      {/* Mobile: stacked. Desktop: three columns */}
      <div className="px-4 py-3 sm:px-10 sm:py-5">
        {/* Mobile layout: centered logo + name */}
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

        {/* Desktop layout: text | logo | text */}
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
            <p className="text-xl font-extrabold text-white">National University of Sciences & Technology</p>
            <p className="text-sm font-semibold" style={{ color: "#f4bf00" }}>
              Electronic Survey System
            </p>
          </div>
        </div>
      </div>

      {/* Gold divider */}
      <div className="mx-4 sm:mx-10" style={{ height: "2px", backgroundColor: "#f4bf00", opacity: 0.6 }} />

      {/* Form title */}
      {surveyTitle ? (
        <div className="px-4 py-4 text-center sm:px-10 sm:py-5">
          {projectName && (
            <p className="mb-1 text-xs font-semibold tracking-wide" style={{ color: "#f4bf00" }}>
              {projectName}
            </p>
          )}
          <h1 className="text-lg font-bold leading-snug text-white sm:text-2xl">{surveyTitle}</h1>
        </div>
      ) : (
        <div className="pb-4" />
      )}

      {/* Bottom gold stripe */}
      <div className="h-2 w-full" style={{ backgroundColor: "#f4bf00" }} />
    </div>
  );
};
