import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./messages/en";
import { zh } from "./messages/zh";

export type Locale = "en" | "zh";
export const LOCALES: readonly Locale[] = ["en", "zh"];
export const LOCALE_LABELS: Record<Locale, string> = { en: "English", zh: "中文" };

// Type-safe keys: `t()` is checked against the English resource shape.
declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
  }
}

// Import for the side effect (main.tsx imports "@/i18n" once before render).
// Resources are inline, so init is synchronous — no Suspense / async backend.
void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }, // React already escapes
  react: { useSuspense: false },
});
