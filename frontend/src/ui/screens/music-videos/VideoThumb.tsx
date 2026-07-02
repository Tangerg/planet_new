import { Art } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { Icon } from "@/infra/icons";
import type { VibeMusicVideo } from "@/model/vibe";

/** 16:9 MV card used in the hub and detail rails: cover + hover play affordance. */
export function VideoThumb({
  video,
  accent,
  onOpen,
}: {
  video: VibeMusicVideo;
  accent: string;
  onOpen: () => void;
}) {
  return (
    <Button
      onClick={onOpen}
      className="group block w-[224px] flex-none border-0 bg-transparent p-0 text-left text-white"
      aria-label={video.title}
    >
      <Art
        seed={video.coverSeed}
        image={video.image}
        images={video.images}
        px={448}
        className="aspect-video w-full"
        style={{
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.1), 0 18px 38px -22px rgba(0,0,0,.85)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-85" />
        <div
          className="absolute bottom-3 right-3 grid h-[38px] w-[38px] place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            borderRadius: "50%",
            background: accent,
            color: "#06060a",
            boxShadow: `0 12px 28px -10px ${accent}`,
          }}
        >
          <Icon.play size={15} />
        </div>
      </Art>
      <div className="mt-3 truncate text-[15px] font-light text-white/88">{video.title}</div>
      <div className="mlabel mt-1 truncate text-[10px] text-white/38">
        {video.artist || "Music Video"}
      </div>
    </Button>
  );
}
