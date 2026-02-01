"use client";

import { useLanguage } from "./LanguageProvider";

export function useRTL() {
  const { isRTL } = useLanguage();

  // Helper functions for RTL-aware class names
  const rtlClass = (ltrClass: string, rtlClass: string) => {
    return isRTL ? rtlClass : ltrClass;
  };

  // Common RTL mappings
  const ml = (size: string) => (isRTL ? `mr-${size}` : `ml-${size}`);
  const mr = (size: string) => (isRTL ? `ml-${size}` : `mr-${size}`);
  const pl = (size: string) => (isRTL ? `pr-${size}` : `pl-${size}`);
  const pr = (size: string) => (isRTL ? `pl-${size}` : `pr-${size}`);
  const left = () => (isRTL ? "right" : "left");
  const right = () => (isRTL ? "left" : "right");
  const textAlign = (align: "left" | "right") => {
    if (align === "left") return isRTL ? "text-right" : "text-left";
    if (align === "right") return isRTL ? "text-left" : "text-right";
    return "";
  };

  return {
    isRTL,
    rtlClass,
    ml,
    mr,
    pl,
    pr,
    left,
    right,
    textAlign,
    dir: isRTL ? "rtl" : "ltr",
  };
}
