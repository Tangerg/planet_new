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
      className="gridcard"
      style={{ cursor: "pointer" }}
      onActivate={() => onPlay(track)}
      onContextMenu={(e) => trackMenu(e, track)}
    >
      <div style={{ position: "relative" }}>
        <Art
          className="art"
          seed={track.coverSeed}
          grad={track.gradient}
          image={track.image}
          images={track.images}
          style={{ width: "100%", aspectRatio: "1", borderRadius: 6 }}
        />
        <RiseFab
          className="trackfab"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onPlay(track);
          }}
          aria-label="Play"
          style={{
            position: "absolute",
            right: 12,
            bottom: 12,
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: 0,
            cursor: "pointer",
            background: accent,
            color: "#06060a",
            display: "grid",
            placeItems: "center",
            boxShadow: `0 10px 26px -6px ${accent}`,
          }}
        >
          <Icon.play size={18} />
        </RiseFab>
      </div>
      <div className="truncate" style={{ marginTop: 11, fontSize: 14.5, fontWeight: 400 }}>
        {track.title}
      </div>
      <div
        className="truncate"
        style={{ fontSize: 12.5, fontWeight: 300, color: "rgba(255,255,255,.5)" }}
      >
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
