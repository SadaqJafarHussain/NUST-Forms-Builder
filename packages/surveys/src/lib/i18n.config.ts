import i18n from "i18next";
import ICU from "i18next-icu";
import { initReactI18next } from "react-i18next";
import arTranslations from "../../locales/ar.json";

// Arabic-only configuration
i18n
  .use(ICU)
  .use(initReactI18next)
  .init({
    fallbackLng: "ar",
    supportedLngs: ["ar"],
    lng: "ar",

    resources: {
      ar: { translation: arTranslations },
    },

    interpolation: { escapeValue: false },
  });

export default i18n;
