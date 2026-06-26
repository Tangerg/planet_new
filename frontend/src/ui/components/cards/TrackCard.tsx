// ============================================================
// TrackCard — square track tile for grid views: cover + hover-rise play fab +
// title + artist link. Activating plays the track (no morph — tracks don't open
// a detail screen). Composed from CardShell + Art + PlayFab + ArtistLink.
// ============================================================
import React from "react";
import type { VibeTrack } from "@/model/adapt";
import { Art, Icon } from "@/components/primitives";
import { RiseFab } from "@/components/lift";
import { CardShell } from "@/components/cards/CardShell";
import { ArtistLink } from "@/components/cards/ArtistLink";
import { useScreenActions } from "@/hooks/screenActions";

type TrackCardProps = {
  track: VibeTrack;
  onPlay: (track: VibeTrack) => void;
  accent: string;
  onOpenArtist?: (artist: { id: string; name: string }) => void;
};

export function TrackCard({ track, onPlay, accent, onOpenArtist }: TrackCardProps) {
  const { trackMenu } = useScreenActions();
  return (
    <CardShell
      label={track.title}
      className="gridcard cursor-pointer"
      onActivate={() => onPlay(track)}
      onContextMenu={(e) => trackMenu(e, track)}
    >
      <div className="relative">
        <Art
          className="art aspect-square w-full"
          seed={track.coverSeed}
          grad={track.gradient}
          image={track.image}
          images={track.images}
        />
        <RiseFab
          className="trackfab absolute bottom-3 right-3 grid h-[46px] w-[46px] place-items-center rounded-full border-0"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onPlay(track);
          }}
          aria-label="Play"
          style={{
            background: accent,
            color: "#06060a",
            boxShadow: `0 10px 26px -6px ${accent}`,
          }}
        >
          <Icon.play size={18} />
        </RiseFab>
      </div>
      <div className="truncate mt-[11px] text-[14.5px] font-normal">{track.title}</div>
      <div className="truncate text-[12.5px] font-light text-white/50">
        <ArtistLink
          name={track.artist}
          artistId={track.artistId}
          accent={accent}
          color="rgba(255,255,255,.5)"
          onOpenArtist={onOpenArtist}
        />
      </div>
    </CardShell>
  );
}
