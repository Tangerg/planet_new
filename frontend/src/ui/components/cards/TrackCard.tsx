import React from "react";
import { useTranslation } from "react-i18next";
import type { ArtistRef, VibeTrack } from "@/model/vibe";
import { Art } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { LiftCard, RiseFab } from "@/components/lift";
import { ArtistLinks } from "@/components/cards/ArtistLink";
import { PressTarget } from "@/components/controls/PressTarget";
import { useScreenActions } from "@/hooks/screenActions";
import { useAccent } from "@/hooks/accent";

export const TRACK_CARD_ROW_HEIGHT = 232;

type TrackCardProps = {
  track: VibeTrack;
  onPlay: (track: VibeTrack) => void;
  onOpenArtist?: (artist: ArtistRef) => void;
};

export const TrackCard = React.memo(function TrackCard({
  track,
  onPlay,
  onOpenArtist,
}: TrackCardProps) {
  const accent = useAccent();
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
        <PressTarget
          label={t("a11y.playItem", { name: track.title })}
          onActivate={playFromTarget}
          className="cursor-pointer"
        >
          <Art
            className="art aspect-square w-full"
            seed={track.coverSeed}
            grad={track.gradient}
            image={track.image}
            images={track.images}
          />
        </PressTarget>
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
      <PressTarget
        label={t("a11y.playItem", { name: track.title })}
        onActivate={playFromTarget}
        className="mt-[11px] cursor-pointer truncate text-[14.5px] font-normal"
      >
        {track.title}
      </PressTarget>
      <div className="truncate text-[12.5px] font-light text-white/50">
        <ArtistLinks
          artists={track.artists}
          fallback={track.artist}
          fallbackId={track.artistId}
          color="rgba(255,255,255,.5)"
          onOpenArtist={onOpenArtist}
        />
      </div>
    </LiftCard>
  );
});
