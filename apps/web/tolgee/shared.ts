import { FormatIcu } from "@tolgee/format-icu";
import { DevTools, Tolgee } from "@tolgee/web";

const apiKey = process.env.NEXT_PUBLIC_TOLGEE_API_KEY;
const apiUrl = process.env.NEXT_PUBLIC_TOLGEE_API_URL;

// Arabic-only configuration
export const ALL_LANGUAGES = ["ar-IQ"];

export const DEFAULT_LANGUAGE = "ar-IQ";

export function TolgeeBase() {
  return Tolgee()
    .use(FormatIcu())
    .use(DevTools())
    .updateDefaults({
      apiKey,
      apiUrl,
      defaultLanguage: DEFAULT_LANGUAGE,
      staticData: {
        "ar-IQ": () => import("@/locales/ar-IQ.json"),
      },
      // Add observer options to fix hydration errors
      observerOptions: {
        fullKeyEncode: true,
      },
    });
}
