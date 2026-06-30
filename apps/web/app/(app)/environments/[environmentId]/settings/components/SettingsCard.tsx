"use client";

import { useTranslate } from "@tolgee/react";
import { cn } from "@/lib/cn";
import { Badge } from "@/modules/ui/components/badge";
import { Button } from "@/modules/ui/components/button";

interface ButtonInfo {
  text: string;
  onClick: () => void;
  variant: "secondary" | "default" | "outline" | "ghost" | "link";
}

export const SettingsCard = ({
  title,
  description,
  children,
  soon = false,
  noPadding = false,
  beta,
  className,
  buttonInfo,
  variant = "default",
}: {
  title: string;
  description: string;
  children: any;
  soon?: boolean;
  noPadding?: boolean;
  beta?: boolean;
  className?: string;
  buttonInfo?: ButtonInfo;
  variant?: "default" | "destructive";
}) => {
  const { t } = useTranslate();
  const isDestructive = variant === "destructive";

  return (
    <div
      className={cn("relative my-5 w-full max-w-4xl overflow-hidden rounded-xl shadow-md", className)}
      style={{ border: `1px solid ${isDestructive ? "#fecaca" : "#dbe4f0"}` }}
      id={title}>
      {/* Colored top accent strip */}
      <div className="h-1 w-full" style={{ backgroundColor: isDestructive ? "#ef4444" : "#1b335f" }} />

      {/* Header */}
      <div
        className="flex items-start justify-between px-5 py-4"
        style={{
          background: isDestructive
            ? "linear-gradient(135deg, #fff5f5, #ffffff)"
            : "linear-gradient(135deg, #eef2f9, #f8fafc)",
          borderBottom: `1px solid ${isDestructive ? "#fecaca" : "#dbe4f0"}`,
        }}>
        <div className="flex items-start gap-3">
          {/* Side accent dot */}
          <div
            className="mt-1 h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: isDestructive ? "#ef4444" : "#1b335f" }}
          />
          <div>
            <h3
              className="text-base font-semibold"
              style={{ color: isDestructive ? "#991b1b" : "#1b335f" }}
              suppressHydrationWarning>
              {title}
              {beta && (
                <span className="mr-2 inline-block">
                  <Badge size="normal" type="warning" text="Beta" />
                </span>
              )}
              {soon && (
                <span className="mr-2 inline-block">
                  <Badge
                    size="normal"
                    type="success"
                    text={t("environments.settings.enterprise.coming_soon")}
                  />
                </span>
              )}
            </h3>
            <p
              className="mt-0.5 text-sm"
              style={{ color: isDestructive ? "#b91c1c" : "#64748b" }}
              suppressHydrationWarning>
              {description}
            </p>
          </div>
        </div>
        {buttonInfo && (
          <Button type="button" onClick={buttonInfo?.onClick} variant={buttonInfo?.variant ?? "default"}>
            {buttonInfo?.text}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className={cn("bg-white", noPadding ? "" : "px-5 py-5")}>{children}</div>
    </div>
  );
};
