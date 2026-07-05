"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TUserLocale } from "@formbricks/types/user";
import { timeSince } from "@/lib/time";
import { useSingleUseId } from "@/modules/survey/hooks/useSingleUseId";
import { TSurvey } from "@/modules/survey/list/types/surveys";
import { SurveyDropDownMenu } from "./survey-dropdown-menu";

// Build a compact countdown string like "2ي 3س 45د"
function buildCountdown(deadline: Date): string | null {
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return null;
  const totalMinutes = Math.floor(diff / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}ي ${hours}س`;
  if (hours > 0) return `${hours}س ${minutes}د`;
  if (minutes > 0) return `${minutes}د`;
  return "أقل من دقيقة";
}

// Gradient pairs for card thumbnails
const GRADIENTS = [
  ["#1b335f", "#2563eb"],
  ["#7c3aed", "#a855f7"],
  ["#0891b2", "#0e7490"],
  ["#d97706", "#f59e0b"],
  ["#16a34a", "#15803d"],
  ["#e11d48", "#be123c"],
  ["#0f766e", "#0d9488"],
  ["#9333ea", "#7c3aed"],
];

const getGradient = (id: string): [string, string] => {
  const i = (id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % GRADIENTS.length;
  return GRADIENTS[i] as [string, string];
};

interface SurveyCardProps {
  survey: TSurvey;
  environmentId: string;
  isReadOnly: boolean;
  publicDomain: string;
  deleteSurvey: (surveyId: string) => void;
  locale: TUserLocale;
  onSurveysCopied?: () => void;
}

export const SurveyCard = ({
  survey,
  environmentId,
  isReadOnly,
  publicDomain,
  deleteSurvey,
  locale,
  onSurveysCopied,
}: SurveyCardProps) => {
  const isSurveyCreationDeletionDisabled = isReadOnly;
  const { refreshSingleUseId } = useSingleUseId(survey, isReadOnly);
  const [from, to] = getGradient(survey.id);

  // Real-time deadline — track whether deadline has passed client-side
  const [deadlinePassed, setDeadlinePassed] = useState(() => {
    if (!survey.scheduledClosingAt) return false;
    return Date.now() >= new Date(survey.scheduledClosingAt).getTime();
  });

  useEffect(() => {
    if (!survey.scheduledClosingAt) {
      setDeadlinePassed(false);
      return;
    }
    const deadline = new Date(survey.scheduledClosingAt);
    if (Date.now() >= deadline.getTime()) {
      setDeadlinePassed(true);
      return;
    }
    setDeadlinePassed(false);
    const msUntil = deadline.getTime() - Date.now();
    const id = setTimeout(() => setDeadlinePassed(true), msUntil);
    return () => clearTimeout(id);
  }, [survey.scheduledClosingAt]);

  // Live countdown text (updates every 30s — enough for a card list)
  const [countdown, setCountdown] = useState<string | null>(() => {
    if (!survey.scheduledClosingAt || deadlinePassed) return null;
    return buildCountdown(new Date(survey.scheduledClosingAt));
  });

  useEffect(() => {
    if (!survey.scheduledClosingAt || deadlinePassed) {
      setCountdown(null);
      return;
    }
    const deadline = new Date(survey.scheduledClosingAt);
    const tick = () => setCountdown(buildCountdown(deadline));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [survey.scheduledClosingAt, deadlinePassed]);

  // Effective status: override to "completed" when deadline passed and survey is still active
  const effectiveStatus = deadlinePassed && survey.status === "inProgress" ? "completed" : survey.status;

  const linkHref = useMemo(
    () =>
      effectiveStatus === "draft"
        ? `/environments/${environmentId}/surveys/${survey.id}/edit`
        : `/environments/${environmentId}/surveys/${survey.id}/summary`,
    [effectiveStatus, survey.id, environmentId]
  );

  const isDraftAndReadOnly = effectiveStatus === "draft" && isReadOnly;

  const statusLabel =
    effectiveStatus === "draft"
      ? "مسودة"
      : effectiveStatus === "inProgress"
        ? "نشط"
        : effectiveStatus === "paused"
          ? "موقوف"
          : "مكتمل";

  const statusColor =
    effectiveStatus === "inProgress"
      ? "#16a34a"
      : effectiveStatus === "paused"
        ? "#f59e0b"
        : effectiveStatus === "completed"
          ? "#64748b"
          : "#94a3b8";

  const CardContent = (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ border: "1px solid #e8edf2" }}
      dir="rtl">
      {/* Thumbnail — gradient with subtle form-line decorations */}
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{
          height: 132,
          background: `linear-gradient(135deg, ${from}, ${to})`,
        }}>
        {/* Decorative "form preview" lines */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-20">
          <div className="mb-2 h-2 w-3/4 rounded-full bg-white" />
          <div className="mb-1.5 h-1.5 w-1/2 rounded-full bg-white" />
          <div className="mb-1.5 h-1.5 w-2/3 rounded-full bg-white" />
          <div className="h-1.5 w-2/5 rounded-full bg-white" />
        </div>

        {/* Status badge */}
        <span
          className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
          style={{ backgroundColor: statusColor + "cc" }}>
          {statusLabel}
        </span>

        {/* Deadline-expired icon — bottom-left of thumbnail */}
        {deadlinePassed && survey.status === "inProgress" && (
          <span
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold text-white"
            style={{ backgroundColor: "#dc262699" }}
            title="أُغلق تلقائياً بانتهاء الموعد">
            ⏰ انتهى الموعد
          </span>
        )}

        {/* Active countdown — bottom of thumbnail */}
        {!deadlinePassed && countdown && survey.status === "inProgress" && (
          <span
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: "#1b335fbb" }}
            title={`يُغلق تلقائياً: ${new Date(survey.scheduledClosingAt!).toLocaleString("ar-IQ")}`}>
            ⏱ {countdown}
          </span>
        )}

        {/* 3-dot menu */}
        <button
          className="absolute left-1 top-1"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}>
          <SurveyDropDownMenu
            survey={survey}
            key={`surveys-${survey.id}`}
            environmentId={environmentId}
            publicDomain={publicDomain}
            disabled={isDraftAndReadOnly}
            refreshSingleUseId={refreshSingleUseId}
            isSurveyCreationDeletionDisabled={isSurveyCreationDeletionDisabled}
            deleteSurvey={deleteSurvey}
            onSurveysCopied={onSurveysCopied}
          />
        </button>
      </div>

      {/* Info section */}
      <div className="flex flex-col gap-0.5 bg-white px-3 py-3">
        <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-[#1b335f]">
          {survey.name}
        </p>
        <p className="text-xs text-slate-400">
          {survey.responseCount > 0 ? `${survey.responseCount} استجابة` : "لا توجد استجابات"}
          {" · "}
          {timeSince(survey.updatedAt.toString(), locale)}
        </p>
        {/* Deadline info line */}
        {survey.scheduledClosingAt && survey.status === "inProgress" && (
          <p
            className="mt-0.5 flex items-center gap-1 text-xs font-medium"
            style={{ color: deadlinePassed ? "#dc2626" : "#1b335f" }}>
            {deadlinePassed ? "⏰ أُغلق تلقائياً بانتهاء الموعد" : `⏱ يُغلق بعد: ${countdown ?? "..."}`}
          </p>
        )}
      </div>
    </div>
  );

  return isDraftAndReadOnly ? (
    <div className="block">{CardContent}</div>
  ) : (
    <Link href={linkHref} key={survey.id} className="block">
      {CardContent}
    </Link>
  );
};
