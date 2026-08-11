export type PlaybackAvailabilityStatus = "ready" | "resolvable" | "preview" | "unavailable";

export type PlaybackUnavailableReason =
  | "missing-playback-id"
  | "provider-unsupported"
  | "missing-url"
  | "not-available";

export type PlaybackAvailabilityPolicy = {
  /** Provider can resolve a full stream URL from a track id on demand. */
  canResolveFullPlayback?: boolean;
  /** Provider exposes preview URLs and the player is allowed to use them. */
  canUsePreviewPlayback?: boolean;
};

/**
 * The two policies a source can have today, named so a provider states which
 * kind it is rather than re-deriving the flag pair. Three of the four providers
 * had written the full-streaming literal out identically.
 */
export const PlaybackAvailabilityPolicy = {
  /** The source resolves a full stream URL from a track id on demand (NCM, QQ, the on-device library). */
  fullStream: { canResolveFullPlayback: true, canUsePreviewPlayback: false },
  /** The source offers only short previews (Spotify's Web API without the playback SDK). */
  previewOnly: { canResolveFullPlayback: false, canUsePreviewPlayback: true },
} as const satisfies Record<string, PlaybackAvailabilityPolicy>;

export type PlaybackAvailability = {
  status: PlaybackAvailabilityStatus;
  canStart: boolean;
  reason?: PlaybackUnavailableReason;
};

type PlaybackAvailabilityTrack = {
  id?: string;
  playbackId?: string;
  playUrl?: string;
  previewUrl?: string;
  /** `false` = provider does not license this track for playback (removed / region-locked). */
  available?: boolean;
};

export const PlaybackAvailability = {
  fromTrack(
    track: Partial<PlaybackAvailabilityTrack>,
    policy: PlaybackAvailabilityPolicy = {},
  ): PlaybackAvailability {
    if (track.available === false) {
      return { status: "unavailable", canStart: false, reason: "not-available" };
    }
    if (track.playUrl) return { status: "ready", canStart: true };
    if (track.playbackId && policy.canResolveFullPlayback) {
      return { status: "resolvable", canStart: true };
    }
    if (track.previewUrl && policy.canUsePreviewPlayback !== false) {
      return { status: "preview", canStart: true };
    }
    if (policy.canResolveFullPlayback && !track.playbackId) {
      return { status: "unavailable", canStart: false, reason: "missing-playback-id" };
    }
    if (policy.canResolveFullPlayback || policy.canUsePreviewPlayback) {
      return { status: "unavailable", canStart: false, reason: "missing-url" };
    }
    if (!track.previewUrl) {
      return { status: "unavailable", canStart: false, reason: "provider-unsupported" };
    }
    return { status: "unavailable", canStart: false, reason: "missing-url" };
  },

  requiresFullUrlResolution(availability: PlaybackAvailability): boolean {
    return availability.status === "resolvable";
  },
};
