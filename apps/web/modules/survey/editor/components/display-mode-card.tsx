"use client";

import { TSurvey } from "@formbricks/types/surveys/types";

interface DisplayModeCardProps {
  localSurvey: TSurvey;
  setLocalSurvey: (survey: TSurvey) => void;
}

export const DisplayModeCard = ({ localSurvey, setLocalSurvey }: DisplayModeCardProps) => {
  const isOnePage = localSurvey.isOnePage ?? true;

  const setMode = (onePage: boolean) => {
    setLocalSurvey({ ...localSurvey, isOnePage: onePage });
  };

  return (
    <div className="overflow-hidden rounded-xl shadow-sm" style={{ border: "1px solid #dbe4f0" }} dir="rtl">
      {/* Header */}
      <div
        className="px-5 py-4"
        style={{
          background: "linear-gradient(135deg, #eef2f9, #f8fafc)",
          borderBottom: "1px solid #dbe4f0",
        }}>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#1b335f" }} />
          <p className="text-sm font-semibold" style={{ color: "#1b335f" }}>
            طريقة عرض الفورم
          </p>
        </div>
        <p className="mt-1 pr-5 text-xs text-slate-500">اختر كيف يرى المستجيبون الفورم عند فتح الرابط</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 bg-white p-4">
        {/* One Page */}
        <button
          type="button"
          onClick={() => setMode(true)}
          className="group relative flex flex-col overflow-hidden rounded-xl transition-all"
          style={{
            border: isOnePage ? "2px solid #1b335f" : "2px solid #e2e8f0",
            background: isOnePage ? "#f0f4fa" : "#fafafa",
          }}>
          {/* Active indicator */}
          {isOnePage && (
            <div
              className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: "#1b335f" }}>
              ✓
            </div>
          )}

          {/* Visual mockup */}
          <div
            className="mx-3 mt-4 overflow-hidden rounded-lg bg-white shadow-md"
            style={{ border: "1px solid #e2e8f0" }}>
            {/* Mini form header */}
            <div className="h-1.5 w-full" style={{ backgroundColor: "#f4bf00" }} />
            <div className="space-y-2 p-2">
              <div className="h-2 w-3/4 rounded-full bg-slate-200" />
              {/* Q1 */}
              <div className="rounded bg-slate-50 p-1.5" style={{ border: "1px solid #e2e8f0" }}>
                <div className="mb-1 h-1.5 w-full rounded-full bg-slate-300" />
                <div className="h-3 rounded bg-white" style={{ border: "1px solid #e2e8f0" }} />
              </div>
              {/* Q2 */}
              <div className="rounded bg-slate-50 p-1.5" style={{ border: "1px solid #e2e8f0" }}>
                <div className="mb-1 h-1.5 w-4/5 rounded-full bg-slate-300" />
                <div className="h-3 rounded bg-white" style={{ border: "1px solid #e2e8f0" }} />
              </div>
              {/* Q3 */}
              <div className="rounded bg-slate-50 p-1.5" style={{ border: "1px solid #e2e8f0" }}>
                <div className="mb-1 h-1.5 w-2/3 rounded-full bg-slate-300" />
                <div className="flex gap-1">
                  <div
                    className="h-2.5 flex-1 rounded bg-slate-100"
                    style={{ border: "1px solid #e2e8f0" }}
                  />
                  <div
                    className="h-2.5 flex-1 rounded bg-slate-100"
                    style={{ border: "1px solid #e2e8f0" }}
                  />
                </div>
              </div>
              {/* Submit btn */}
              <div
                className="h-3 w-1/3 rounded-full"
                style={{ backgroundColor: isOnePage ? "#1b335f" : "#cbd5e1" }}
              />
            </div>
          </div>

          {/* Label */}
          <div className="px-3 pb-3 pt-2 text-center">
            <p className="text-xs font-bold" style={{ color: isOnePage ? "#1b335f" : "#475569" }}>
              صفحة واحدة
            </p>
            <p className="mt-0.5 text-[10px] leading-tight text-slate-400">
              كل الأسئلة في صفحة واحدة تُملأ دفعة واحدة
            </p>
          </div>
        </button>

        {/* Step-by-step */}
        <button
          type="button"
          onClick={() => setMode(false)}
          className="group relative flex flex-col overflow-hidden rounded-xl transition-all"
          style={{
            border: !isOnePage ? "2px solid #1b335f" : "2px solid #e2e8f0",
            background: !isOnePage ? "#f0f4fa" : "#fafafa",
          }}>
          {/* Active indicator */}
          {!isOnePage && (
            <div
              className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: "#1b335f" }}>
              ✓
            </div>
          )}

          {/* Visual mockup */}
          <div
            className="mx-3 mt-4 overflow-hidden rounded-lg bg-white shadow-md"
            style={{ border: "1px solid #e2e8f0" }}>
            <div className="h-1.5 w-full" style={{ backgroundColor: "#f4bf00" }} />
            <div className="space-y-2 p-2">
              {/* Progress bar */}
              <div className="flex items-center gap-1">
                <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: "#1b335f" }} />
                <div className="h-1 flex-1 rounded-full bg-slate-200" />
                <div className="h-1 flex-1 rounded-full bg-slate-200" />
                <div className="text-[8px] text-slate-400">١/٣</div>
              </div>
              {/* Single question */}
              <div className="rounded bg-slate-50 p-2" style={{ border: "1px solid #e2e8f0" }}>
                <div className="mb-1.5 h-2 w-full rounded-full bg-slate-300" />
                <div className="mb-1 h-2 w-4/5 rounded-full bg-slate-200" />
                <div className="h-5 rounded bg-white" style={{ border: "1px solid #e2e8f0" }} />
              </div>
              {/* Next btn */}
              <div className="flex justify-end">
                <div
                  className="h-3 w-1/3 rounded-full"
                  style={{ backgroundColor: !isOnePage ? "#1b335f" : "#cbd5e1" }}
                />
              </div>
            </div>
          </div>

          {/* Label */}
          <div className="px-3 pb-3 pt-2 text-center">
            <p className="text-xs font-bold" style={{ color: !isOnePage ? "#1b335f" : "#475569" }}>
              استبيان تدريجي
            </p>
            <p className="mt-0.5 text-[10px] leading-tight text-slate-400">
              سؤال واحد في كل خطوة مع زر التالي
            </p>
          </div>
        </button>
      </div>

      {/* Current selection banner */}
      <div className="border-t px-4 py-2.5" style={{ borderColor: "#dbe4f0", backgroundColor: "#f8fafc" }}>
        <p className="text-center text-xs" style={{ color: "#1b335f" }}>
          <span className="font-semibold">الوضع الحالي:</span>{" "}
          {isOnePage ? "صفحة واحدة — جميع الأسئلة معاً" : "استبيان تدريجي — سؤال واحد في كل مرة"}
        </p>
      </div>
    </div>
  );
};
