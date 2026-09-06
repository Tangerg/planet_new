import type { AlbumSnapshot } from "@domain/model/album";
import type { ArtistLink, ArtistSnapshot } from "@domain/model/artist";
import type { Image } from "@domain/model/image";
import type { PlaylistSnapshot } from "@domain/model/playlist";
import type { Track } from "@domain/model/track";

import type {
  SpotifyArtist,
  SpotifyImage,
  SpotifySimplifiedAlbum,
  SpotifySimplifiedArtist,
  SpotifySimplifiedPlaylist,
  SpotifyTrack,
} from "./types";
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

/** A credited artist, wherever Spotify embeds one. */
export function toArtistLink(a: SpotifySimplifiedArtist): ArtistLink {
  return { providerId: SPOTIFY_PROVIDER_ID, id: a.id, name: a.name };
}

export function toAlbumSnapshot(al: SpotifySimplifiedAlbum): AlbumSnapshot {
  return {
    providerId: SPOTIFY_PROVIDER_ID,
    id: al.id,
    name: al.name,
    images: toImages(al.images),
    totalTracks: al.total_tracks ?? 0,
    artists: (al.artists ?? []).map(toArtistLink),
  };
}

export function toPlaylistSnapshot(pl: SpotifySimplifiedPlaylist): PlaylistSnapshot {
  return {
    providerId: SPOTIFY_PROVIDER_ID,
    id: pl.id,
    name: pl.name,
    images: toImages(pl.images),
    totalTracks: pl.tracks?.total ?? 0,
  };
}

export function toArtistSnapshot(ar: SpotifyArtist): ArtistSnapshot {
  return {
    providerId: SPOTIFY_PROVIDER_ID,
    id: ar.id,
    name: ar.name,
    images: toImages(ar.images),
    genres: ar.genres ?? [],
  };
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
    artists: t.artists.map(toArtistLink),
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
