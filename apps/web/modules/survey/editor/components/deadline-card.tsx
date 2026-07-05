"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { CalendarClockIcon, ChevronDownIcon, ChevronUpIcon, XCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { TSurvey } from "@formbricks/types/surveys/types";

interface DeadlineCardProps {
  localSurvey: TSurvey;
  setLocalSurvey: (survey: TSurvey | ((s: TSurvey) => TSurvey)) => void;
}

// Format a Date to local datetime-local input value (YYYY-MM-DDTHH:MM)
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Format a Date for Arabic display
function formatArabic(d: Date): string {
  return d.toLocaleString("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Compute remaining time string (Arabic)
function getRemainingLabel(deadline: Date): string {
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return "انتهى الموعد";
  const totalMinutes = Math.floor(diff / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} يوم`);
  if (hours > 0) parts.push(`${hours} ساعة`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} دقيقة`);
  return `يُغلق بعد ${parts.join(" و")}`;
}

export const DeadlineCard = ({ localSurvey, setLocalSurvey }: DeadlineCardProps) => {
  const hasDeadline = !!localSurvey.scheduledClosingAt;
  const [open, setOpen] = useState(hasDeadline);
  const [remaining, setRemaining] = useState<string | null>(null);

  // Live countdown ticker
  useEffect(() => {
    if (!localSurvey.scheduledClosingAt) {
      setRemaining(null);
      return;
    }
    const deadline = new Date(localSurvey.scheduledClosingAt);
    const tick = () => setRemaining(getRemainingLabel(deadline));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [localSurvey.scheduledClosingAt]);

  const handleChange = (value: string) => {
    if (!value) {
      setLocalSurvey((s) => ({ ...s, scheduledClosingAt: null }));
      return;
    }
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      setLocalSurvey((s) => ({ ...s, scheduledClosingAt: parsed }));
    }
  };

  const handleClear = () => {
    setLocalSurvey((s) => ({ ...s, scheduledClosingAt: null }));
  };

  const deadline = localSurvey.scheduledClosingAt ? new Date(localSurvey.scheduledClosingAt) : null;
  const isExpired = deadline ? Date.now() >= deadline.getTime() : false;

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      className="w-full rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl px-5 py-4 text-right transition-colors hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "#1b335f15" }}>
              <CalendarClockIcon className="h-5 w-5" style={{ color: "#1b335f" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">موعد إغلاق النموذج</p>
              <p className="text-xs text-slate-500">
                {deadline
                  ? isExpired
                    ? "انتهى الموعد — النموذج مغلق"
                    : formatArabic(deadline)
                  : "لا يوجد موعد إغلاق محدد"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {deadline && !isExpired && remaining && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: "#1b335f12", color: "#1b335f" }}>
                {remaining}
              </span>
            )}
            {deadline && isExpired && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: "#dc262618", color: "#dc2626" }}>
                منتهي الصلاحية
              </span>
            )}
            {open ? (
              <ChevronUpIcon className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-slate-500" />
            )}
          </div>
        </button>
      </Collapsible.Trigger>

      {/* Body */}
      <Collapsible.Content>
        <div className="space-y-4 border-t border-slate-100 px-5 py-5" dir="rtl">
          {/* Date-time picker */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              تاريخ ووقت الإغلاق التلقائي
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={deadline ? toDatetimeLocal(deadline) : ""}
                onChange={(e) => handleChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition focus:border-[#1b335f] focus:outline-none focus:ring-1 focus:ring-[#1b335f]"
              />
              {deadline && (
                <button
                  type="button"
                  onClick={handleClear}
                  title="حذف الموعد"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-red-500">
                  <XCircleIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              سيُغلق النموذج تلقائياً عند الوصول إلى هذا الموعد ولن يقبل أي ردود جديدة.
            </p>
          </div>

          {/* Status display */}
          {deadline && (
            <div
              className="flex items-start gap-3 rounded-lg p-3"
              style={{
                backgroundColor: isExpired ? "#dc262608" : "#1b335f08",
                border: `1px solid ${isExpired ? "#dc262630" : "#1b335f20"}`,
              }}>
              <CalendarClockIcon
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                style={{ color: isExpired ? "#dc2626" : "#1b335f" }}
              />
              <div>
                <p className="text-sm font-medium" style={{ color: isExpired ? "#dc2626" : "#1b335f" }}>
                  {isExpired ? "انتهى الموعد" : "الموعد المحدد"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{formatArabic(deadline)}</p>
                {!isExpired && remaining && (
                  <p className="mt-1 text-xs font-medium" style={{ color: "#1b335f" }}>
                    {remaining}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
