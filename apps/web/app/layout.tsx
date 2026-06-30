import { TolgeeStaticData } from "@tolgee/react";
import { Metadata } from "next";
import localFont from "next/font/local";
import React from "react";
import { SentryProvider } from "@/app/sentry/SentryProvider";
import { IS_PRODUCTION, SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_RELEASE } from "@/lib/constants";
import { TolgeeNextProvider } from "@/tolgee/client";
import { getTolgee } from "@/tolgee/server";
import "../modules/ui/globals.css";
import "../styles/rtl.css";

const cairo = localFont({
  src: [
    { path: "../public/fonts/cairo/cairo-arabic.woff2", weight: "400 700", style: "normal" },
    { path: "../public/fonts/cairo/cairo-latin-ext.woff2", weight: "400 700", style: "normal" },
    { path: "../public/fonts/cairo/cairo-latin.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | NUST Forms",
    default: "NustForms",
  },
  description: "Open-Source Survey Suite",
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  // Arabic-only mode - always use ar-IQ and RTL
  const locale = "ar-IQ";
  const tolgee = await getTolgee();
  const staticData = await tolgee.loadRequired();

  return (
    <html lang="ar-IQ" dir="rtl" translate="no" suppressHydrationWarning className={cairo.variable}>
      <body className="flex h-dvh flex-col transition-all ease-in-out" suppressHydrationWarning>
        <SentryProvider
          sentryDsn={SENTRY_DSN}
          sentryRelease={SENTRY_RELEASE}
          sentryEnvironment={SENTRY_ENVIRONMENT}
          isEnabled={IS_PRODUCTION}>
          <TolgeeNextProvider language={locale} staticData={staticData as unknown as TolgeeStaticData}>
            {children}
          </TolgeeNextProvider>
        </SentryProvider>
      </body>
    </html>
  );
};

export default RootLayout;
