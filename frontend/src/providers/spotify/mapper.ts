import type { Artist } from "@domain/model/artist";
import type { Image } from "@domain/model/image";
import type { Track } from "@domain/model/track";

import type { SpotifyImage, SpotifySimplifiedAlbum, SpotifyTrack } from "./types";

/** Spotify returns images largest-first; map straight to domain Image[] (null → undefined). */
export function toImages(images: SpotifyImage[] | undefined): Image[] {
  return (images ?? []).map(
    (im): Image => ({
      url: im.url,
      width: im.width ?? undefined,
      height: im.height ?? undefined,
    }),
  );
}

export function toTrack(
  t: SpotifyTrack,
  fallbackAlbum?: SpotifySimplifiedAlbum,
  index?: number,
): Partial<Track> {
  const album = t.album ?? fallbackAlbum;
  return {
    index,
    id: t.id,
    name: t.name,
    durationMs: t.duration_ms,
    explicit: t.explicit,
    trackNumber: t.track_number,
    artists: t.artists.map((a): Partial<Artist> => ({ id: a.id, name: a.name })),
    album: album
      ? {
          id: album.id,
          name: album.name,
          images: toImages(album.images),
        }
      : undefined,
    previewUrl: t.preview_url ?? undefined,
    playUrl: t.preview_url ?? undefined,
  };
}
