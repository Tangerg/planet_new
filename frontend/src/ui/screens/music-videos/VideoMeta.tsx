import type { VibeMusicVideo } from "@/model/vibe";
import { musicVideoMetaLabel } from "@/model/music-video-screen";

/** One-line MV metadata: quality · duration · play count (blanks dropped). */
export function VideoMeta({ video }: { video: VibeMusicVideo }) {
  return <span className="mlabel text-[10px] text-white/42">{musicVideoMetaLabel(video)}</span>;
}
