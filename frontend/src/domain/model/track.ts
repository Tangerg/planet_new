import type { Artist } from "./artist";
import type { Album } from "./album";
import { pickImageUrl } from "./image";
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
};

export type TrackPlayUrl = {
  id: string;
  playUrl: string;
};

/**
 * Track behavior. Co-located with the type so display/business derivations
 * live in the domain rather than being re-implemented in each UI consumer.
 * Accepts `Partial<Track>` because entities flow as partials across provider
 * boundaries (list payloads omit fields a detail call would carry).
 */
export const Track = {
  /** The credited lead artist, or undefined when none are known. */
  primaryArtist(t: Partial<Track>): Partial<Artist> | undefined {
    return t.artists?.[0];
  },

  /** Credited artists as a display string; falls back to the album's artists. */
  artistNames(t: Partial<Track>): string {
    const names = (t.artists ?? []).map((a) => a?.name).filter(Boolean);
    if (names.length) return names.join(", ");
    return (t.album?.artists ?? [])
      .map((a) => a?.name)
      .filter(Boolean)
      .join(", ");
  },

  durationSeconds(t: Partial<Track>): number {
    return Math.floor((t.durationMs ?? 0) / Second);
  },

  durationFormatted(t: Partial<Track>): string {
    return formatDuration(t.durationMs ?? 0, [Minute, Second]);
  },

  /** Playable now without further resolution: a full or preview URL is present. */
  isPlayable(t: Partial<Track>): boolean {
    return Boolean(t.playUrl || t.previewUrl);
  },

  /** Cover art comes from the owning album. */
  coverUrl(t: Partial<Track>, prefer: "large" | "small" = "large"): string {
    return pickImageUrl(t.album?.images, prefer);
  },
};
