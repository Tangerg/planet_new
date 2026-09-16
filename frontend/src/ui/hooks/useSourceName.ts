import { useMediaService } from "@/hooks/useMediaService";
import { sourceDisplayName } from "@/model/source-name";
import type { LocalizedText } from "@/i18n/text";

export function useSourceName(): LocalizedText {
  const media = useMediaService();
  return sourceDisplayName(media.providerId);
}
