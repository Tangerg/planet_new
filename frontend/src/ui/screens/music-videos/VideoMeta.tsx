import type { VibeMusicVideo } from "@/model/vibe";
import { compactCount } from "@shared/number";

/** One-line MV metadata: quality · duration · play count (blanks dropped). */
export function VideoMeta({ video }: { video: VibeMusicVideo }) {
  const pieces = [
    video.quality ? `${video.quality}P` : "MV",
    video.duration,
    video.playCount ? `${compactCount(video.playCount)} plays` : "",
  ].filter(Boolean);
  return <span className="mlabel text-[10px] text-white/42">{pieces.join(" · ")}</span>;
}
