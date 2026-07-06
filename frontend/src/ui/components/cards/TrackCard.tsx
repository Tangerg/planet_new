// ============================================================
// TrackCard — square track tile for grid views: cover + hover-rise play fab +
// title + artist link. Activating plays the track (no morph — tracks don't open
// a detail screen). The whole tile is a mouse hit-area, while cover/title keep
// the keyboard-accessible targets and artist/fab stop propagation.
// ============================================================
import React from "react";
import { useTranslation } from "react-i18next";
import type { ArtistRef, VibeTrack } from "@/model/vibe";
import { Art } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { LiftCard, RiseFab } from "@/components/lift";
import { ArtistLinks } from "@/components/cards/ArtistLink";
import { useScreenActions } from "@/hooks/screenActions";
import { activateOnKey } from "@/lib/keys";

type TrackCardProps = {
  track: VibeTrack;
  onPlay: (track: VibeTrack) => void;
  accent: string;
  onOpenArtist?: (artist: ArtistRef) => void;
};

// React.memo: leaf of the grid track view; TrackCollectionView re-invokes
// renderItem for every visible cell on each scroll windowing tick. Call sites
// pass stable onPlay/accent/onOpenArtist + a stable track object, so the shallow
// compare bails and only entering cards render during a scroll.
export const TrackCard = React.memo(function TrackCard({
  track,
  onPlay,
  accent,
  onOpenArtist,
}: TrackCardProps) {
  const { t } = useTranslation();
  const { trackMenu } = useScreenActions();
  const play = () => onPlay(track);
  const playFromTarget = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    play();
  };
  return (
    <LiftCard
      className="gridcard cursor-pointer text-left text-white"
      onClick={play}
      onContextMenu={(e) => trackMenu(e, track)}
    >
      <div className="relative">
        <div
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- rich art tile, not valid native button content
          role="button"
          tabIndex={0}
          aria-label={t("a11y.playItem", { name: track.title })}
          onClick={playFromTarget}
          onKeyDown={activateOnKey(playFromTarget)}
          className="cursor-pointer"
        >
          <Art
            className="art aspect-square w-full"
            seed={track.coverSeed}
            grad={track.gradient}
            image={track.image}
            images={track.images}
          />
        </div>
        <RiseFab
          className="trackfab absolute bottom-3 right-3 grid h-[46px] w-[46px] place-items-center rounded-full border-0"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            play();
          }}
          aria-label={t("a11y.playItem", { name: track.title })}
          style={{
            background: accent,
            color: "#06060a",
            boxShadow: `0 10px 26px -6px ${accent}`,
          }}
        >
          <Icon.play size={18} />
        </RiseFab>
      </div>
      <div
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- title is a lightweight secondary play target
        role="button"
        tabIndex={0}
        aria-label={t("a11y.playItem", { name: track.title })}
        onClick={playFromTarget}
        onKeyDown={activateOnKey(playFromTarget)}
        className="mt-[11px] cursor-pointer truncate text-[14.5px] font-normal"
      >
        {track.title}
      </div>
      <div className="truncate text-[12.5px] font-light text-white/50">
        <ArtistLinks
          artists={track.artists}
          fallback={track.artist}
          fallbackId={track.artistId}
          accent={accent}
          color="rgba(255,255,255,.5)"
          onOpenArtist={onOpenArtist}
        />
      </div>
    </LiftCard>
  );
});
