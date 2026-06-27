import { create } from "zustand";
import { useCallback } from "react";
import { en, type MessageKey } from "./messages/en";
import { zh } from "./messages/zh";

export type Locale = "en" | "zh";
export const LOCALES: readonly Locale[] = ["en", "zh"];
export const LOCALE_LABELS: Record<Locale, string> = { en: "English", zh: "中文" };

// A pack may be incomplete; English is the complete source of truth + fallback.
const PACKS: Record<Locale, Partial<Record<MessageKey, string>>> = { en, zh };

export type TParams = Record<string, string | number>;

/** Look up a key in the active locale, falling back to English, then to the raw key.
 *  `{name}` placeholders are filled from `params`. */
function translate(locale: Locale, key: MessageKey, params?: TParams): string {
  const text = PACKS[locale]?.[key] ?? en[key];
  if (!params) return text;
  return Object.entries(params).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(String(v)), text);
}

type LocaleStore = { locale: Locale; setLocale: (locale: Locale) => void };

/** Active UI locale. A small dedicated store (theme-like cross-cutting UI state);
 *  not persisted yet — rides along once app persistence lands. */
export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: "en",
  setLocale: (locale) => set({ locale }),
}));

export type TFunc = (key: MessageKey, params?: TParams) => string;

/** Translate hook: `const t = useT(); t("browse.empty")`. Re-renders on locale change. */
export function useT(): TFunc {
  const locale = useLocaleStore((s) => s.locale);
  return useCallback((key, params) => translate(locale, key, params), [locale]);
}
