"use client";

import { createContext, useContext, useEffect } from "react";

// Arabic-only language configuration
interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
  initialLocale?: string; // Kept for compatibility but ignored
}) {
  // Always Arabic, always RTL
  const locale = "ar-IQ";
  const isRTL = true;

  // Ensure RTL is set on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar-IQ";
    }
  }, []);

  // setLocale is a no-op since we only support Arabic
  const setLocale = () => {
    // No-op: Arabic is the only supported language
  };

  return <LanguageContext.Provider value={{ locale, setLocale, isRTL }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
