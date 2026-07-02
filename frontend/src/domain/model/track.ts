import type { Artist } from "./artist";
import type { Album } from "./album";
import { ArtistCredit } from "./artist-credit";
import { pickImageUrl } from "./image";
import { PlaybackAvailability, type PlaybackAvailabilityPolicy } from "./playback-availability";
import { formatDuration, Minute, Second } from "@shared/time";

/**
 * Track, aligned with the Spotify Track object's semantics (camelCase).
 * Duration is milliseconds (`durationMs`, mirroring Spotify's `duration_ms`).
 */
export type Track = {
  index?: number;
  id: string;
  name: string;
  durationMs: number;
  artists: Partial<Artist>[];
  album?: Partial<Album>;
  trackNumber?: number;
  discNumber?: number;
  explicit?: boolean;
  /** 30s preview clip; only some providers (e.g. Spotify) expose it. */
  previewUrl?: string;
  /** Full playable URL, filled in after on-demand resolution. */
  playUrl?: string;
  /** Linked music-video id, when the provider exposes one. */
  musicVideoId?: string;
};

export type TrackPlayUrl = {
  id: string;
  playUrl: string;
};

function creditedArtists(t: Partial<Track>): Partial<Artist>[] {
  const artists = t.artists?.filter((artist) => artist?.name?.trim()) ?? [];
  if (artists.length) return artists;
  return t.album?.artists?.filter((artist) => artist?.name?.trim()) ?? [];
}

/**
 * Track behavior. Co-located with the type so display/business derivations
 * live in the domain rather than being re-implemented in each UI consumer.
 * Accepts `Partial<Track>` because entities flow as partials across provider
 * boundaries (list payloads omit fields a detail call would carry).
 */
export const Track = {
  /** The credited lead artist, falling back to album credit when a list payload omits track artists. */
  primaryArtist(t: Partial<Track>): Partial<Artist> | undefined {
    return creditedArtists(t)[0];
  },

  /** Artist credits as value objects, preserving unnamed ids out of display flow. */
  artistCredits(t: Partial<Track>): ArtistCredit[] {
    return ArtistCredit.from(t.artists, t.album?.artists);
  },

  /** Credited artists as a display string; falls back to the album's artists. */
  artistNames(t: Partial<Track>): string {
    return ArtistCredit.names(Track.artistCredits(t));
  },

  durationSeconds(t: Partial<Track>): number {
    return Math.floor((t.durationMs ?? 0) / Second);
  },

  durationFormatted(t: Partial<Track>): string {
    return formatDuration(t.durationMs ?? 0, [Minute, Second]);
  },

  playbackAvailability(
    t: Partial<Track>,
    policy?: PlaybackAvailabilityPolicy,
  ): PlaybackAvailability {
    return PlaybackAvailability.fromTrack(t, policy);
  },

  /** Can start now or after provider URL resolution, depending on policy. */
  isPlayable(t: Partial<Track>, policy?: PlaybackAvailabilityPolicy): boolean {
    return Track.playbackAvailability(t, policy).canStart;
  },

  /**
   * The provider can play audio, but not *this* track — the signal a list row
   * uses to dim itself. Deliberately NOT `!isPlayable`: a provider with no
   * playback capability at all (Mock) reports false so its rows stay interactive
   * as a dev source, rather than every row showing "unavailable".
   */
  isUnavailable(t: Partial<Track>, policy?: PlaybackAvailabilityPolicy): boolean {
    const canPlayAnything = Boolean(
      policy?.canResolveFullPlayback || policy?.canUsePreviewPlayback,
    );
    return canPlayAnything && !Track.isPlayable(t, policy);
  },

  /** Clone tracks and apply resolved provider playback URLs by id, preserving order. */
  withResolvedPlayUrls(tracks: readonly Track[], urls: readonly TrackPlayUrl[]): Track[] {
    const byTrackId = new Map(urls.map((url) => [url.id, url.playUrl]));
    return tracks.map((track) => {
      const playUrl = byTrackId.get(track.id);
      return playUrl ? { ...track, playUrl } : { ...track };
    });
  },

  /** Provider lookup ids from a track set, de-duplicated in encounter order. */
  uniqueIds(tracks: readonly Partial<Track>[]): string[] {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const track of tracks) {
      const id = track.id?.trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
    return ids;
  },

  /** Cover art comes from the owning album. */
  coverUrl(t: Partial<Track>, prefer: "large" | "small" = "large"): string {
    return pickImageUrl(t.album?.images, prefer);
  },
};
