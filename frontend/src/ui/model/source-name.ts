import type { ProviderId } from "@contexts/contracts";

import type { LocalizedText, MessageKey } from "@/i18n/text";

/**
 * The single answer to "what does the UI call this music source".
 *
 * A source has two other names already, and neither is a display name: the
 * stable machine `ProviderId`, and the adapter's `name`, which architecture.md
 * marks as diagnostic metadata. Screens used to invent a third — a hardcoded
 * Chinese label map in Settings, and a fixed "Netease Cloud Music" eyebrow on
 * Profile / Music Videos that stayed put no matter which source was active.
 */
const SOURCE_NAME_KEYS: Readonly<Record<string, MessageKey>> = {
  netease: "source.netease",
  qqmusic: "source.qqmusic",
  spotify: "source.spotify",
  local: "source.local",
};

/**
 * A source's display name. Falls back to the adapter's diagnostic name for a
 * source this build has no message for, so adding a provider degrades to a
 * readable label instead of a raw id.
 */
export function sourceDisplayName(
  providerId: ProviderId | undefined,
  diagnosticName?: string,
): LocalizedText {
  const key = providerId ? SOURCE_NAME_KEYS[providerId] : undefined;
  if (key) return { key };
  return { text: diagnosticName || providerId || "" };
}
