import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./messages/en";
import { zh } from "./messages/zh";

export type Locale = "en" | "zh";
export const LOCALES: readonly Locale[] = ["en", "zh"];
export const LOCALE_LABELS: Record<Locale, string> = { en: "English", zh: "中文" };

declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
  }
}

void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});
