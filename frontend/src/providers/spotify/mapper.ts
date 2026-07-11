import type { ArtistLink } from "@domain/model/artist";
import type { Image } from "@domain/model/image";
import type { Track } from "@domain/model/track";

import type { SpotifyImage, SpotifySimplifiedAlbum, SpotifyTrack } from "./types";
import { SPOTIFY_PROVIDER_ID } from "./identity";

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
): Track {
  const album = t.album ?? fallbackAlbum;
  return {
    providerId: SPOTIFY_PROVIDER_ID,
    index,
    id: t.id,
    playbackId: t.id,
    name: t.name,
    durationMs: t.duration_ms,
    explicit: t.explicit,
    trackNumber: t.track_number,
    artists: t.artists.map(
      (a): ArtistLink => ({ providerId: SPOTIFY_PROVIDER_ID, id: a.id, name: a.name }),
    ),
    album: album
      ? {
          providerId: SPOTIFY_PROVIDER_ID,
          id: album.id,
          name: album.name,
          images: toImages(album.images),
        }
      : undefined,
    previewUrl: t.preview_url ?? undefined,
    playUrl: t.preview_url ?? undefined,
  };
}
