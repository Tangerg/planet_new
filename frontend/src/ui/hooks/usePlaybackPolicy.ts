import { useMemo } from "react";

import type { PlaybackAvailabilityPolicy } from "@contexts/playback";

import { usePlaybackService } from "@/hooks/usePlaybackService";

export function usePlaybackPolicy(): PlaybackAvailabilityPolicy {
  const playback = usePlaybackService();
  return useMemo(() => playback.playbackPolicy(), [playback]);
}
