"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { BaseCard } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/base-card";

interface InteractiveCardProps {
  tab: "dropOffs" | "quotas";
  label: string;
  percentage: number;
  value: React.ReactNode;
  tooltipText: string;
  isLoading: boolean;
  onClick: () => void;
  isActive: boolean;
  accentColor?: string;
  icon?: React.ReactNode;
}

export const InteractiveCard = ({
  tab,
  label,
  percentage,
  value,
  tooltipText,
  isLoading,
  onClick,
  isActive,
  accentColor,
  icon,
}: InteractiveCardProps) => {
  return (
    <BaseCard
      label={label}
      percentage={percentage}
      tooltipText={tooltipText}
      isLoading={isLoading}
      onClick={onClick}
      testId={`${tab}-toggle`}
      id={`${tab}-toggle`}
      accentColor={accentColor}
      icon={icon}>
      <div className="flex w-full items-center justify-between">
        <span className="text-3xl font-bold text-slate-800">
          {isLoading ? <div className="h-8 w-16 animate-pulse rounded-full bg-slate-200"></div> : value}
        </span>
        {!isLoading && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100">
            {isActive ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          </div>
        )}
      </div>
    </BaseCard>
  );
};
