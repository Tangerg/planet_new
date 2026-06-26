// ============================================================
// ArtistLink — the inline "go to artist" name that hover-swaps to the accent
// colour. Repeated verbatim in TrackRow, TrackCard, NowPlaying and PlayerBar;
// converged here. With no opener (or no artistId) it degrades to plain text, so
// callers can always use it in place of a bare `{track.artist}`.
// ============================================================
import React from "react";
import { Button } from "@/components/controls/Button";

type ArtistLinkProps = {
  /** Display name. */
  name?: string;
  artistId?: string;
  accent: string;
  /** Resting colour (varies per surface); hover goes to `accent`. */
  color: string;
  onOpenArtist?: (artist: { id: string; name: string }) => void;
  style?: React.CSSProperties;
};

export function ArtistLink({
  name,
  artistId,
  accent,
  color,
  onOpenArtist,
  style,
}: ArtistLinkProps) {
  if (!(onOpenArtist && artistId)) return <>{name ?? ""}</>;
  const open = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    onOpenArtist({ id: artistId, name: name ?? "" });
  };
  return (
    <Button
      style={{
        cursor: "pointer",
        transition: "color .2s",
        background: "none",
        border: 0,
        padding: 0,
        font: "inherit",
        color,
        textAlign: "left",
        ...style,
      }}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(e);
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = color;
      }}
    >
      {name}
    </Button>
  );
}
