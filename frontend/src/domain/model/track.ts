import type { ArtistLink } from "./artist";
import type { AlbumReference } from "./album";
import { ArtistCredit } from "./artist-credit";
import { pickImageUrl } from "./image";
import { PlaybackAvailability, type PlaybackAvailabilityPolicy } from "./playback-availability";
import { formatDuration, Minute, Second } from "@shared/time";
import type { ProviderId } from "./provider-id";

/**
 * Track, aligned with the Spotify Track object's semantics (camelCase).
 * Duration is milliseconds (`durationMs`, mirroring Spotify's `duration_ms`).
 */
export type Track = {
  /** Stable source identity; `id` below is local to this provider. */
  providerId: ProviderId;
  index?: number;
  id: string;
  name: string;
  durationMs: number;
  artists: ArtistLink[];
  album?: AlbumReference;
  trackNumber?: number;
  discNumber?: number;
  explicit?: boolean;
  /** 30s preview clip; only some providers (e.g. Spotify) expose it. */
  previewUrl?: string;
  /** Full playable URL, filled in after on-demand resolution. */
  playUrl?: string;
  /**
   * Provider-specific key used to resolve a playable stream URL. Often the same
   * as `id`, but not guaranteed (for example QQ chart rows may expose a numeric
   * song id while playback needs songmid). Undefined means "cannot be resolved
   * into a stream from this payload".
   */
  playbackId?: string;
  /** Linked music-video id, when the provider exposes one. */
  musicVideoId?: string;
  /** Full playback needs a paid subscription/entitlement the current listener may
   *  lack. Provider-neutral: each provider maps its own tier concept onto it. */
  requiresSubscription?: boolean;
  /** Whether the provider licenses this track for playback at all. `false` = not
   *  licensed / removed / region-locked (provider-neutral). Undefined = available. */
  available?: boolean;
};

/** Stable list/detail track snapshot. Track currently has no separate
 * detail-only fields, but the explicit name prevents Partial<Track> contracts. */
export type TrackSnapshot = Track;

export type TrackPlayUrl = {
  playbackId: string;
  playUrl: string;
};

export type ProviderTrackPlayUrls = {
  providerId: ProviderId;
  urls: readonly TrackPlayUrl[];
};

function creditedArtists(t: Partial<Track>): ArtistLink[] {
  const artists = t.artists?.filter((artist) => artist?.name?.trim()) ?? [];
  if (artists.length) return artists;
  return t.album?.artists?.filter((artist) => artist?.name?.trim()) ?? [];
}

/**
 * Track behavior. Co-located with the type so display/business derivations
 * live in the domain rather than being re-implemented in each UI consumer.
 * Helpers accept partial projection input so placeholders and defensive display
 * code can derive safe values. Provider and application boundaries still use
 * explicit TrackSnapshot contracts.
 */
export const Track = {
  /** The credited lead artist, falling back to album credit when a list payload omits track artists. */
  primaryArtist(t: Partial<Track>): ArtistLink | undefined {
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
   * playback capability at all reports false so its rows stay interactive
   * as a dev source, rather than every row showing "unavailable".
   */
  isUnavailable(t: Partial<Track>, policy?: PlaybackAvailabilityPolicy): boolean {
    if (t.available === false) return true; // not licensed → always dimmed
    const canPlayAnything = Boolean(
      policy?.canResolveFullPlayback || policy?.canUsePreviewPlayback,
    );
    return canPlayAnything && !Track.isPlayable(t, policy);
  },

  /** Clone tracks and apply resolved URLs by source + playback id, preserving order. */
  withResolvedPlayUrls(
    tracks: readonly Track[],
    resolutions: readonly ProviderTrackPlayUrls[],
  ): Track[] {
    const byProvider = new Map(
      resolutions.map(({ providerId, urls }) => [
        providerId,
        new Map(urls.map((url) => [url.playbackId, url.playUrl])),
      ]),
    );
    return tracks.map((track) => {
      const playUrl = track.playbackId
        ? byProvider.get(track.providerId)?.get(track.playbackId)
        : undefined;
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

  /** Playback lookup keys from a track set, de-duplicated in encounter order. */
  uniquePlaybackIds(tracks: readonly Partial<Track>[]): string[] {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const track of tracks) {
      const id = track.playbackId?.trim();
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
