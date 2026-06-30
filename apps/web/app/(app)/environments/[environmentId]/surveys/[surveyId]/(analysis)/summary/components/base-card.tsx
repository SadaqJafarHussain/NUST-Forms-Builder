"use client";

import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/modules/ui/components/tooltip";
import { cn } from "@/modules/ui/lib/utils";

interface BaseCardProps {
  label: ReactNode;
  percentage?: number | null;
  tooltipText?: ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  testId?: string;
  id?: string;
  accentColor?: string;
  icon?: ReactNode;
}

export const BaseCard = ({
  label,
  percentage = null,
  tooltipText,
  isLoading = false,
  onClick,
  children,
  className,
  testId,
  id,
  accentColor = "#1b335f",
  icon,
}: BaseCardProps) => {
  const isClickable = !!onClick;

  return (
    <TooltipProvider delayDuration={50}>
      <Tooltip>
        <TooltipTrigger onClick={onClick} data-testid={testId} className="w-full text-right">
          <div
            className={cn(
              "flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow",
              isClickable ? "cursor-pointer hover:shadow-md" : "cursor-default",
              className
            )}
            style={{ borderTop: `4px solid ${accentColor}` }}
            id={id}
            dir="rtl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              {icon && (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${accentColor}18` }}>
                  <span style={{ color: accentColor }}>{icon}</span>
                </div>
              )}
            </div>
            {children}
            {typeof percentage === "number" &&
              !isNaN(percentage) &&
              Number.isFinite(percentage) &&
              !isLoading && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round(percentage))}%`,
                        backgroundColor: accentColor,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: accentColor }}>
                    {Math.round(percentage)}%
                  </span>
                </div>
              )}
          </div>
        </TooltipTrigger>
        {tooltipText && (
          <TooltipContent side="bottom" className="max-w-xs text-right" dir="rtl">
            <p>{tooltipText}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
