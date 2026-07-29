import type { ArtistLink } from "./artist";
import { ArtistCredit } from "./artist-credit";
import { type Image, pickImageUrl } from "./image";
import { formatDuration, Minute, Second } from "@shared/time";
import type { ProviderId } from "./provider-id";

/**
 * Music video, deliberately narrower than a generic "video" model.
 * Planet only treats official music videos as part of the core streaming
 * surface; short-video feeds, live rooms, Mlog, etc. stay out of scope.
 */
export type MusicVideo = {
  /** Stable source identity; `id` below is local to this provider. */
  providerId: ProviderId;
  id: string;
  name: string;
  images: Image[];
  artists: ArtistLink[];
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

export type MusicVideoSummary = Pick<
  MusicVideo,
  "providerId" | "id" | "name" | "images" | "artists" | "durationMs"
>;

export type MusicVideoDetailSnapshot = MusicVideo;

/** Catalog list/detail projection input. Summary fields are complete while
 * detail-only playback and engagement facts remain optional until resolved. */
export type MusicVideoSnapshot = MusicVideoSummary &
  Partial<Omit<MusicVideo, keyof MusicVideoSummary>>;

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

export type MusicVideoPlaybackCandidate = Partial<
  Pick<MusicVideo, "id" | "playUrl" | "playbackResolved" | "available">
>;

export const MusicVideo = {
  coverUrl(mv: MusicVideoSnapshot, prefer: "large" | "small" = "large"): string {
    return pickImageUrl(mv.images, prefer);
  },

  primaryArtist(mv: MusicVideoSnapshot): ArtistLink | undefined {
    return mv.artists?.find((artist) => artist?.name?.trim());
  },

  artistCredits(mv: MusicVideoSnapshot): ArtistCredit[] {
    return ArtistCredit.from(mv.artists);
  },

  artistNames(mv: MusicVideoSnapshot): string {
    return ArtistCredit.names(MusicVideo.artistCredits(mv));
  },

  durationSeconds(mv: MusicVideoSnapshot): number {
    return Math.floor((mv.durationMs ?? 0) / Second);
  },

  durationFormatted(mv: MusicVideoSnapshot): string {
    return formatDuration(mv.durationMs ?? 0, [Minute, Second]);
  },

  playbackAvailability(
    mv: MusicVideoPlaybackCandidate,
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

  isPlayable(mv: MusicVideoPlaybackCandidate, policy?: MusicVideoAvailabilityPolicy): boolean {
    return MusicVideo.playbackAvailability(mv, policy).canStart;
  },

  isUnavailable(mv: MusicVideoPlaybackCandidate, policy?: MusicVideoAvailabilityPolicy): boolean {
    return !MusicVideo.isPlayable(mv, policy);
  },

  uniqueById<T extends { id?: string }>(videos: readonly T[]): T[] {
    const seen = new Set<string>();
    const unique: T[] = [];
    for (const video of videos) {
      const id = String(video.id ?? "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      unique.push(video);
    }
    return unique;
  },
};
