// ============================================================
// ArtistLink — the inline "go to artist" name that hover-swaps to the accent
// colour. Repeated verbatim in TrackRow, TrackCard, NowPlaying and PlayerBar;
// converged here. With no opener (or no artistId) it degrades to plain text, so
// callers can always use it in place of a bare `{track.artist}`.
// ============================================================
import React from "react";
import type { ArtistRef } from "@/model/vibe";
import { artistCreditLine } from "@/model/artist-credit";
import { Button } from "@/components/controls/Button";
import { activateOnKey } from "@/lib/keys";

/** Inline style carrying the link's rest/hover colour custom properties. */
type ArtistLinkStyle = React.CSSProperties & {
  "--alink-rest"?: string;
  "--alink-hover"?: string;
};

type ArtistLinkProps = {
  /** Display name. */
  name?: string;
  artistId?: string;
  accent: string;
  /** Resting colour (varies per surface); hover goes to `accent`. */
  color: string;
  onOpenArtist?: (artist: ArtistRef) => void;
  style?: ArtistLinkStyle;
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
      // Rest/hover colours ride in as custom properties so the swap is a `:hover`
      // rule. Writing `currentTarget.style.color` from mouse handlers (as this
      // did) fights React: any re-render while the cursor is on the link — a
      // playback tick, a like — restores the rest colour under the pointer.
      className="alink p-0 text-left transition-colors duration-200"
      style={{ font: "inherit", "--alink-rest": color, "--alink-hover": accent, ...style }}
      onClick={open}
      onKeyDown={activateOnKey(open)}
    >
      {name}
    </Button>
  );
}

type ArtistLinksProps = {
  /** Every credited artist; each name is its own link, so a group credit lets
   *  you jump to ANY member. Entries without an id degrade to plain text. */
  artists?: ArtistRef[];
  /** Joined names used when there's no per-artist list (provider gave a string). */
  fallback?: string;
  /** Primary artist id for that single fallback link. */
  fallbackId?: string;
  accent: string;
  color: string;
  onOpenArtist?: (artist: ArtistRef) => void;
};

/**
 * A credited-artist line. Renders one ArtistLink per artist (", "-separated, the
 * same join as Track.artistNames) so multi-artist tracks are individually
 * navigable; falls back to a single link over `fallback` when no list is given.
 * Overflow is the caller's job (a `truncate` container, or a marquee).
 */
export function ArtistLinks({
  artists,
  fallback,
  fallbackId,
  accent,
  color,
  onOpenArtist,
}: ArtistLinksProps) {
  const creditLine = artistCreditLine({ artists, fallback, fallbackId });
  if (creditLine.kind === "fallback-artist") {
    return (
      <ArtistLink
        name={creditLine.name}
        artistId={creditLine.artistId}
        accent={accent}
        color={color}
        onOpenArtist={onOpenArtist}
      />
    );
  }
  return (
    <>
      {creditLine.artists.map((a, i) => (
        <React.Fragment key={(a.id || a.name) + i}>
          {i > 0 && <span style={{ color }}>, </span>}
          <ArtistLink
            name={a.name}
            artistId={a.id}
            accent={accent}
            color={color}
            onOpenArtist={onOpenArtist}
          />
        </React.Fragment>
      ))}
    </>
  );
}
