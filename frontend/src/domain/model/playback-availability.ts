export type PlaybackAvailabilityStatus = "ready" | "resolvable" | "preview" | "unavailable";

export type PlaybackUnavailableReason = "missing-track-id" | "provider-unsupported" | "missing-url";

export type PlaybackAvailabilityPolicy = {
  /** Provider can resolve a full stream URL from a track id on demand. */
  canResolveFullPlayback?: boolean;
  /** Provider exposes preview URLs and the player is allowed to use them. */
  canUsePreviewPlayback?: boolean;
};

export type PlaybackAvailability = {
  status: PlaybackAvailabilityStatus;
  canStart: boolean;
  reason?: PlaybackUnavailableReason;
};

type PlaybackAvailabilityTrack = {
  id?: string;
  playUrl?: string;
  previewUrl?: string;
};

export const PlaybackAvailability = {
  fromTrack(
    track: Partial<PlaybackAvailabilityTrack>,
    policy: PlaybackAvailabilityPolicy = {},
  ): PlaybackAvailability {
    if (track.playUrl) return { status: "ready", canStart: true };
    if (track.id && policy.canResolveFullPlayback) return { status: "resolvable", canStart: true };
    if (track.previewUrl && policy.canUsePreviewPlayback !== false) {
      return { status: "preview", canStart: true };
    }
    if (!track.id) return { status: "unavailable", canStart: false, reason: "missing-track-id" };
    if (!policy.canResolveFullPlayback && !track.previewUrl) {
      return { status: "unavailable", canStart: false, reason: "provider-unsupported" };
    }
    return { status: "unavailable", canStart: false, reason: "missing-url" };
  },

  requiresFullUrlResolution(availability: PlaybackAvailability): boolean {
    return availability.status === "resolvable";
  },
};
