"use client";

import { useTranslate } from "@tolgee/react";
import { CheckCircle2Icon, ClockIcon, EyeIcon, TrendingDownIcon, UsersIcon } from "lucide-react";
import { TSurveySummary } from "@formbricks/types/surveys/types";
import { InteractiveCard } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/interactive-card";
import { StatCard } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/stat-card";
import { cn } from "@/modules/ui/lib/utils";

interface SummaryMetadataProps {
  surveySummary: TSurveySummary["meta"];
  isLoading: boolean;
  tab: "dropOffs" | "quotas" | undefined;
  setTab: React.Dispatch<React.SetStateAction<"dropOffs" | "quotas" | undefined>>;
  isQuotasAllowed: boolean;
}

const formatTime = (ttc) => {
  const seconds = ttc / 1000;
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}د ${remainingSeconds}ث`;
  }
  return `${seconds.toFixed(0)}ث`;
};

export const SummaryMetadata = ({
  surveySummary,
  isLoading,
  tab,
  setTab,
  isQuotasAllowed,
}: SummaryMetadataProps) => {
  const {
    completedPercentage,
    completedResponses,
    displayCount,
    dropOffPercentage,
    dropOffCount,
    startsPercentage,
    totalResponses,
    ttcAverage,
    quotasCompleted,
    quotasCompletedPercentage,
  } = surveySummary;
  const { t } = useTranslate();
  const dropoffCountValue = dropOffCount === 0 ? <span>-</span> : dropOffCount;

  const handleTabChange = (val: "dropOffs" | "quotas") => {
    const change = tab === val ? undefined : val;
    setTab(change);
  };

  return (
    <div dir="rtl">
      <div
        className={cn(
          `grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-5`,
          isQuotasAllowed && "2xl:grid-cols-6"
        )}>
        <StatCard
          label="مشاهدات الفورم"
          percentage={null}
          value={displayCount === 0 ? <span className="text-slate-300">-</span> : displayCount}
          tooltipText="عدد المرات التي عُرض فيها الفورم على المستخدمين"
          isLoading={isLoading}
          accentColor="#1b335f"
          icon={<EyeIcon className="h-4 w-4" />}
        />
        <StatCard
          label="المشاركون"
          percentage={Math.round(startsPercentage) > 100 ? null : Math.round(startsPercentage)}
          value={totalResponses === 0 ? <span className="text-slate-300">-</span> : totalResponses}
          tooltipText="عدد الأشخاص الذين بدأوا بتعبئة الفورم"
          isLoading={isLoading}
          accentColor="#2563eb"
          icon={<UsersIcon className="h-4 w-4" />}
        />
        <StatCard
          label="الردود المكتملة"
          percentage={Math.round(completedPercentage) > 100 ? null : Math.round(completedPercentage)}
          value={completedResponses === 0 ? <span className="text-slate-300">-</span> : completedResponses}
          tooltipText="عدد الأشخاص الذين أتمّوا تعبئة الفورم حتى النهاية"
          isLoading={isLoading}
          accentColor="#16a34a"
          icon={<CheckCircle2Icon className="h-4 w-4" />}
        />
        <InteractiveCard
          key="dropOffs"
          tab="dropOffs"
          label="تركوا الفورم"
          percentage={dropOffPercentage}
          value={dropoffCountValue}
          tooltipText="عدد الأشخاص الذين بدأوا ثم تركوا الفورم دون إكمال"
          isLoading={isLoading}
          onClick={() => handleTabChange("dropOffs")}
          isActive={tab === "dropOffs"}
          accentColor="#dc2626"
          icon={<TrendingDownIcon className="h-4 w-4" />}
        />
        <StatCard
          label="متوسط وقت الإجابة"
          percentage={null}
          value={ttcAverage === 0 ? <span className="text-slate-300">-</span> : formatTime(ttcAverage)}
          tooltipText="متوسط الوقت الذي يستغرقه المشارك لإتمام الفورم"
          isLoading={isLoading}
          accentColor="#f4bf00"
          icon={<ClockIcon className="h-4 w-4" />}
        />
        {isQuotasAllowed && (
          <InteractiveCard
            key="quotas"
            tab="quotas"
            label={t("environments.surveys.summary.quotas_completed")}
            percentage={quotasCompletedPercentage}
            value={quotasCompleted}
            tooltipText={t("environments.surveys.summary.quotas_completed_tooltip")}
            isLoading={isLoading}
            onClick={() => handleTabChange("quotas")}
            isActive={tab === "quotas"}
            accentColor="#7c3aed"
          />
        )}
      </div>
    </div>
  );
};
