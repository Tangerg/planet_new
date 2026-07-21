import { useTranslation } from "react-i18next";

import type { ArtistRef, VibeTrack } from "@/model/vibe";
import { ArtistLinks } from "@/components/cards/ArtistLink";
import { PressTarget } from "@/components/controls/PressTarget";
import { Marquee } from "@/components/Marquee";
import { Art } from "@/components/primitives";

type Props = {
  track?: VibeTrack;
  accent: string;
  onOpenNowPlaying: (element: HTMLElement) => void;
  onOpenArtist?: (artist: ArtistRef) => void;
};

export function PlayerTrackIdentity({ track, accent, onOpenNowPlaying, onOpenArtist }: Props) {
  const { t } = useTranslation();
  const openNowPlayingFrom = (element: HTMLElement) => {
    onOpenNowPlaying(element.closest<HTMLElement>("[data-player-identity]") ?? element);
  };
  return (
    <div
      data-player-identity
      className="relative z-[1] flex w-[224px] min-w-0 flex-none cursor-pointer items-center gap-[11px] pl-[18px] pr-1.5"
    >
      <PressTarget
        label={t("a11y.openNowPlaying")}
        onActivate={(e) => openNowPlayingFrom(e.currentTarget)}
        className="flex-none"
      >
        <Art
          seed={track?.coverSeed || 0}
          grad={track?.gradient}
          image={track?.image}
          images={track?.images}
          className="flex-none"
          style={{
            width: 54,
            height: 54,
            boxShadow: "0 1px 2px rgba(0,0,0,.25), 0 6px 16px -4px rgba(0,0,0,.35)",
          }}
        />
      </PressTarget>
      <div className="min-w-0">
        <PressTarget
          label={t("a11y.openNowPlaying")}
          onActivate={(e) => openNowPlayingFrom(e.currentTarget)}
        >
          <Marquee className="text-[16px] font-normal">{track?.title || "—"}</Marquee>
        </PressTarget>
        <Marquee className="text-[13px] font-light text-[rgba(20,20,24,0.55)]">
          <ArtistLinks
            artists={track?.artists}
            fallback={track?.artist || ""}
            fallbackId={track?.artistId}
            accent={accent}
            color="rgba(20,20,24,.55)"
            onOpenArtist={onOpenArtist}
          />
        </Marquee>
      </div>
    </div>
  );
}
