import type { Artist } from "./artist";
import { ArtistCredit } from "./artist-credit";
import { type Image, pickImageUrl } from "./image";
import { formatDuration, Minute, Second } from "@shared/time";

/**
 * Music video, deliberately narrower than a generic "video" model.
 * Planet only treats official music videos as part of the core streaming
 * surface; short-video feeds, live rooms, Mlog, etc. stay out of scope.
 */
export type MusicVideo = {
  id: string;
  name: string;
  images: Image[];
  artists: Partial<Artist>[];
  durationMs?: number;
  description?: string;
  publishDate?: string;
  playCount?: number;
  commentCount?: number;
  likedCount?: number;
  shareCount?: number;
  /** Resolved playable MV URL, filled by providers that support it. */
  playUrl?: string;
  /** Whether the provider already attempted to resolve the MV playback URL. */
  playbackResolved?: boolean;
  /** Full MV playback needs a paid subscription/entitlement the current listener may lack. */
  requiresSubscription?: boolean;
  /** `false` = provider does not license this MV for playback. Undefined = available/unknown. */
  available?: boolean;
  /** Chosen resolution, e.g. 1080. */
  quality?: number;
};

export type MusicVideoAvailabilityStatus = "ready" | "resolvable" | "unavailable";

export type MusicVideoUnavailableReason =
  | "missing-video-id"
  | "provider-unsupported"
  | "missing-url"
  | "not-available";

export type MusicVideoAvailabilityPolicy = {
  /** Provider can fetch MV detail / playback URL from a music-video id. */
  canResolvePlayback?: boolean;
};

export type MusicVideoAvailability = {
  status: MusicVideoAvailabilityStatus;
  canStart: boolean;
  reason?: MusicVideoUnavailableReason;
};

export const MusicVideo = {
  coverUrl(mv: Partial<MusicVideo>, prefer: "large" | "small" = "large"): string {
    return pickImageUrl(mv.images, prefer);
  },

  primaryArtist(mv: Partial<MusicVideo>): Partial<Artist> | undefined {
    return mv.artists?.find((artist) => artist?.name?.trim());
  },

  artistCredits(mv: Partial<MusicVideo>): ArtistCredit[] {
    return ArtistCredit.from(mv.artists);
  },

  artistNames(mv: Partial<MusicVideo>): string {
    return ArtistCredit.names(MusicVideo.artistCredits(mv));
  },

  durationSeconds(mv: Partial<MusicVideo>): number {
    return Math.floor((mv.durationMs ?? 0) / Second);
  },

  durationFormatted(mv: Partial<MusicVideo>): string {
    return formatDuration(mv.durationMs ?? 0, [Minute, Second]);
  },

  playbackAvailability(
    mv: Partial<MusicVideo>,
    policy: MusicVideoAvailabilityPolicy = {},
  ): MusicVideoAvailability {
    if (mv.available === false) {
      return { status: "unavailable", canStart: false, reason: "not-available" };
    }
    if (mv.playUrl) return { status: "ready", canStart: true };
    if (!mv.id) return { status: "unavailable", canStart: false, reason: "missing-video-id" };
    if (policy.canResolvePlayback && !mv.playbackResolved) {
      return { status: "resolvable", canStart: true };
    }
    if (policy.canResolvePlayback) {
      return { status: "unavailable", canStart: false, reason: "missing-url" };
    }
    return { status: "unavailable", canStart: false, reason: "provider-unsupported" };
  },

  isPlayable(mv: Partial<MusicVideo>, policy?: MusicVideoAvailabilityPolicy): boolean {
    return MusicVideo.playbackAvailability(mv, policy).canStart;
  },

  isUnavailable(mv: Partial<MusicVideo>, policy?: MusicVideoAvailabilityPolicy): boolean {
    return !MusicVideo.isPlayable(mv, policy);
  },

  uniqueById(videos: readonly Partial<MusicVideo>[]): Partial<MusicVideo>[] {
    const seen = new Set<string>();
    const unique: Partial<MusicVideo>[] = [];
    for (const video of videos) {
      const id = String(video.id ?? "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      unique.push(video);
    }
    return unique;
  },
};
