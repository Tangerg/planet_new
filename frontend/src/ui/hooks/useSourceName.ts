import { useMediaService } from "@/hooks/useMediaService";
import { sourceDisplayName } from "@/model/source-name";
import type { LocalizedText } from "@/i18n/text";

/**
 * The active music source's display name. Read through MediaService so screens
 * never touch the provider registry, and so switching sources changes the label
 * with the same data refresh that changes the content beneath it.
 */
export function useSourceName(): LocalizedText {
  const media = useMediaService();
  return sourceDisplayName(media.providerId);
}
