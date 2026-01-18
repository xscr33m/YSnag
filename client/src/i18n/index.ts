import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import de from "./locales/de.json";

// ISO 3166-1 alpha-2 country codes for flag-icons
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", countryCode: "gb" },
  { code: "de", name: "Deutsch", countryCode: "de" },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "ysnag-language",
      caches: ["localStorage"],
    },
  });

export default i18n;
