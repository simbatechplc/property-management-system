import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import am from "./locales/am.json";
import om from "./locales/om.json";

export const LANGUAGES = [
  { code: "en", label: "EN", fullLabel: "English" },
  { code: "am", label: "አማ", fullLabel: "አማርኛ" },
  { code: "om", label: "OM", fullLabel: "Afan Oromo" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
      om: { translation: om },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "am", "om"],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "kuru_lang",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
