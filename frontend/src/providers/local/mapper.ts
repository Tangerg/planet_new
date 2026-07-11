import type { Track } from "@domain/model/track";
import type { Album } from "@domain/model/album";
import type { Artist, ArtistLink } from "@domain/model/artist";
import { singleImage } from "@providers/mapping";
import type { LocalAlbum, LocalArtist, LocalTrack } from "./types";
import { LOCAL_PROVIDER_ID } from "./identity";

/**
 * Go DTO → domain. Local tracks arrive with their loopback `playUrl` and album
 * cover URL already built by the media server, so mapping is a straight rename;
 * only the field-shape rules (`singleImage`, year → releaseDate) are applied.
 */

/** One artist reference, dropped when the name is blank. */
function artistRef(id: string, name: string): ArtistLink[] {
  return name ? [{ providerId: LOCAL_PROVIDER_ID, id, name }] : [];
}

/** Parse a numeric year, kept undefined when the tag had none. Encoded as a
 *  local-midnight datetime so `Album.year()`'s Date parse never drifts a year
 *  across time zones (a bare "YYYY" would be read as UTC). */
function releaseDate(year: number): string | undefined {
  return year > 0 ? `${year}-01-01T00:00:00` : undefined;
}

export function toTrack(t: LocalTrack): Track {
  return {
    providerId: LOCAL_PROVIDER_ID,
    id: t.id,
    name: t.title,
    durationMs: t.durationMs,
    artists: artistRef(t.artistId, t.artist),
    album: {
      providerId: LOCAL_PROVIDER_ID,
      id: t.albumId,
      name: t.album,
      images: singleImage(t.coverUrl),
      artists: artistRef(t.artistId, t.artist),
    },
    trackNumber: t.trackNumber || undefined,
    discNumber: t.discNumber || undefined,
    // Already a playable loopback stream — carry it as both the resolution key
    // and the resolved URL, so the track is "ready" with no playUrls() round-trip.
    playbackId: t.id,
    playUrl: t.playUrl || undefined,
    available: true,
  };
}

export function toAlbum(a: LocalAlbum): Album {
  return {
    providerId: LOCAL_PROVIDER_ID,
    id: a.id,
    name: a.name,
    images: singleImage(a.coverUrl),
    artists: artistRef(a.artistId, a.artist),
    releaseDate: releaseDate(a.year),
    totalTracks: a.trackCount || undefined,
  };
}

export function toArtist(a: LocalArtist): Artist {
  return {
    providerId: LOCAL_PROVIDER_ID,
    id: a.id,
    name: a.name,
    images: singleImage(a.coverUrl),
  };
}
