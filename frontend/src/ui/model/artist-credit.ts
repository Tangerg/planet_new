import type { ArtistRef } from "./vibe";

export type ArtistCreditLine =
  | { kind: "credited-artists"; artists: ArtistRef[] }
  | { kind: "fallback-artist"; name?: string; artistId?: string };

export function artistCreditLine({
  artists,
  fallback,
  fallbackId,
}: {
  artists?: readonly ArtistRef[];
  fallback?: string;
  fallbackId?: string;
}): ArtistCreditLine {
  const creditedArtists = (artists ?? []).filter(hasArtistName);
  if (creditedArtists.length > 0) {
    return { kind: "credited-artists", artists: creditedArtists };
  }

  return { kind: "fallback-artist", name: fallback, artistId: fallbackId };
}

function hasArtistName(artist: ArtistRef): boolean {
  return Boolean(artist.name);
}
