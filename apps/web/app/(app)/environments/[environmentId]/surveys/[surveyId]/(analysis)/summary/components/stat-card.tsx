"use client";

import { ReactNode } from "react";
import { BaseCard } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/base-card";

interface StatCardProps {
  label: ReactNode;
  percentage?: number | null;
  value: ReactNode;
  tooltipText?: ReactNode;
  isLoading?: boolean;
  accentColor?: string;
  icon?: ReactNode;
}

export const StatCard = ({
  label,
  percentage = null,
  value,
  tooltipText,
  isLoading = false,
  accentColor,
  icon,
}: StatCardProps) => {
  return (
    <BaseCard
      label={label}
      percentage={percentage}
      tooltipText={tooltipText}
      isLoading={isLoading}
      accentColor={accentColor}
      icon={icon}>
      {isLoading ? (
        <div className="h-8 w-16 animate-pulse rounded-full bg-slate-200"></div>
      ) : (
        <p className="text-3xl font-bold text-slate-800">{value}</p>
      )}
    </BaseCard>
  );
};
