import { useTranslation } from "react-i18next";

import { localizeJoined } from "@/i18n/text";
import type { VibeMusicVideo } from "@/model/vibe";
import { musicVideoMetaPieces } from "@/model/music-video-screen";

export function VideoMeta({ video }: { video: VibeMusicVideo }) {
  const { t } = useTranslation();
  return (
    <span className="mlabel text-[10px] text-white/42">
      {localizeJoined(t, musicVideoMetaPieces(video))}
    </span>
  );
}
