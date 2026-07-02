import { useMemo } from "react";

import type { PlaybackAvailabilityPolicy } from "@domain/model/playback-availability";

import { usePlaybackService } from "@/hooks/usePlaybackService";

/**
 * The active provider's playback resolution policy (full-stream vs preview),
 * from PlaybackService. Session-stable (the provider is fixed for a session),
 * so reading it per row is cheap — used to derive per-track availability.
 */
export function usePlaybackPolicy(): PlaybackAvailabilityPolicy {
  const playback = usePlaybackService();
  return useMemo(() => playback.playbackPolicy(), [playback]);
}
