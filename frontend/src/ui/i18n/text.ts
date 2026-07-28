import type { ParseKeys, TFunction, TOptions } from "i18next";

/** Every message key the English pack defines, checked at compile time. */
export type MessageKey = ParseKeys;

/**
 * A user-facing string carried as data.
 *
 * Pure model/derivation code (`ui/model/*`) has no hook context, so it cannot
 * call `t()`. It therefore names the message instead of formatting it, and the
 * render edge resolves it with `localize`. This keeps exactly one source of
 * truth for display text: the message packs.
 *
 * `text` is the escape hatch for content that is already user-authored (a track
 * title, an artist name) and must never be keyed or translated.
 */
export type LocalizedText =
  | Readonly<{ key: MessageKey; values?: TOptions }>
  | Readonly<{ text: string }>;

/** Resolve a model-authored message for rendering. */
export function localize(t: TFunction, value: LocalizedText): string;
export function localize(t: TFunction, value: LocalizedText | undefined): string | undefined;
export function localize(t: TFunction, value: LocalizedText | undefined): string | undefined {
  if (!value) return undefined;
  return "text" in value ? value.text : t(value.key, value.values);
}

/**
 * Resolve a meta line whose parts are chosen by the model but joined for
 * display (e.g. "2019 · 12 tracks"). Parts that resolve to nothing drop out, so
 * the separator never dangles.
 */
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
