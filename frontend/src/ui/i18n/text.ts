import type { ParseKeys, TFunction, TOptions } from "i18next";

export type MessageKey = ParseKeys;

export type LocalizedText =
  Readonly<{ key: MessageKey; values?: TOptions }> | Readonly<{ text: string }>;

export function localize(t: TFunction, value: LocalizedText): string;
export function localize(t: TFunction, value: LocalizedText | undefined): string | undefined;
export function localize(t: TFunction, value: LocalizedText | undefined): string | undefined {
  if (!value) return undefined;
  return "text" in value ? value.text : t(value.key, value.values);
}

export function localizeJoined(
  t: TFunction,
  parts: readonly LocalizedText[],
  separator = " · ",
): string {
  return parts
    .map((part) => localize(t, part))
    .filter(Boolean)
    .join(separator);
}
