import type { ProviderId } from "@contexts/contracts";

import type { LocalizedText, MessageKey } from "@/i18n/text";

const SOURCE_NAME_KEYS: Readonly<Record<string, MessageKey>> = {
  netease: "source.netease",
  qqmusic: "source.qqmusic",
  spotify: "source.spotify",
  local: "source.local",
};

export function sourceDisplayName(
  providerId: ProviderId | undefined,
  diagnosticName?: string,
): LocalizedText {
  const key = providerId ? SOURCE_NAME_KEYS[providerId] : undefined;
  if (key) return { key };
  return { text: diagnosticName || providerId || "" };
}
