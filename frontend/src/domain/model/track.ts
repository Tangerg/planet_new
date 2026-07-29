import type { ArtistLink } from "./artist";
import type { AlbumReference } from "./album";
import { ArtistCredit } from "./artist-credit";
import { pickImageUrl } from "./image";
import { PlaybackAvailability, type PlaybackAvailabilityPolicy } from "./playback-availability";
import { uniqueTrimmed } from "@shared/array";
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

function creditedArtists(t: TrackSnapshot): ArtistLink[] {
  const artists = t.artists?.filter((artist) => artist?.name?.trim()) ?? [];
  if (artists.length) return artists;
  return t.album?.artists?.filter((artist) => artist?.name?.trim()) ?? [];
}

/**
 * Track behavior. Co-located with the type so display/business derivations
 * live in the domain rather than being re-implemented in each UI consumer.
 * Helpers take a whole TrackSnapshot: a projection is only ever derived from a
 * track a mapper produced, so widening to Partial would only invite callers to
 * hand the domain half-built objects.
 */
export const Track = {
  /** The credited lead artist, falling back to album credit when a list payload omits track artists. */
  primaryArtist(t: TrackSnapshot): ArtistLink | undefined {
    return creditedArtists(t)[0];
  },

  /** Artist credits as value objects, preserving unnamed ids out of display flow. */
  artistCredits(t: TrackSnapshot): ArtistCredit[] {
    return ArtistCredit.from(t.artists, t.album?.artists);
  },

  /** Credited artists as a display string; falls back to the album's artists. */
  artistNames(t: TrackSnapshot): string {
    return ArtistCredit.names(Track.artistCredits(t));
  },

  durationSeconds(t: TrackSnapshot): number {
    return Math.floor((t.durationMs ?? 0) / Second);
  },

  durationFormatted(t: TrackSnapshot): string {
    return formatDuration(t.durationMs ?? 0, [Minute, Second]);
  },

  playbackAvailability(
    t: TrackSnapshot,
    policy?: PlaybackAvailabilityPolicy,
  ): PlaybackAvailability {
    return PlaybackAvailability.fromTrack(t, policy);
  },

  /** Can start now or after provider URL resolution, depending on policy. */
  isPlayable(t: TrackSnapshot, policy?: PlaybackAvailabilityPolicy): boolean {
    return Track.playbackAvailability(t, policy).canStart;
  },

  /**
   * The provider can play audio, but not *this* track — the signal a list row
   * uses to dim itself. Deliberately NOT `!isPlayable`: a provider with no
   * playback capability at all reports false so its rows stay interactive
   * as a dev source, rather than every row showing "unavailable".
   */
  isUnavailable(t: TrackSnapshot, policy?: PlaybackAvailabilityPolicy): boolean {
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
  uniqueIds(tracks: readonly TrackSnapshot[]): string[] {
    return uniqueTrimmed(tracks.map((track) => track.id));
  },

  /** Playback lookup keys from a track set, de-duplicated in encounter order. */
  uniquePlaybackIds(tracks: readonly TrackSnapshot[]): string[] {
    return uniqueTrimmed(tracks.map((track) => track.playbackId));
  },

  /** Cover art comes from the owning album. */
  coverUrl(t: TrackSnapshot, prefer: "large" | "small" = "large"): string {
    return pickImageUrl(t.album?.images, prefer);
  },
};
