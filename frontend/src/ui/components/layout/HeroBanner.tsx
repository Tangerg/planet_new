// ============================================================
// HeroBanner — the featured playlist banner on ForYou. Supplies the playlist's
// copy and actions; the banner chrome itself is BannerFrame, shared with the
// music-video hub's featured hero.
// ============================================================
import { useTranslation } from "react-i18next";
import type { VibeCollection } from "@/model/vibe";
import {
  BannerActions,
  BannerFrame,
  BannerPrimaryAction,
  BannerTag,
  BannerTitle,
} from "@/components/layout/BannerFrame";
import { Button } from "@/components/controls/Button";
import { useMorphOpen } from "@/hooks/useMorphOpen";
import { collectionTrackCount } from "@/model/derive";

type HeroBannerProps = {
  playlist: VibeCollection;
  onOpen: () => void;
  onPlay?: () => void;
};

export function HeroBanner({ playlist, onOpen, onPlay }: HeroBannerProps) {
  const open = useMorphOpen();
  const { t } = useTranslation();
  return (
    <BannerFrame image={playlist.image} seed={playlist.coverSeed} grad={playlist.gradient}>
      <BannerTag>{t("forYou.featured")}</BannerTag>
      <BannerTitle>{playlist.name}</BannerTitle>
      <div className="line-clamp-2 max-w-[460px] text-[15px] font-light leading-[1.55] text-white/[0.72]">
        {playlist.description}
      </div>
      <BannerActions>
        {onPlay && <BannerPrimaryAction onClick={onPlay}>{t("common.play")}</BannerPrimaryAction>}
        <Button
          onClick={(e) =>
            open(e, {
              seed: playlist.coverSeed,
              grad: playlist.gradient,
              image: playlist.image,
              run: onOpen,
            })
          }
          className="pill-ghost"
        >
          {t("common.open")}
        </Button>
        <span className="mlabel ml-1.5 text-white/50">
          {t("counts.tracks", { count: collectionTrackCount(playlist) })}
        </span>
      </BannerActions>
    </BannerFrame>
  );
}
