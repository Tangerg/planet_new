import type { PlaybackService } from "@contexts/playback";
import { useEngine } from "./useEngine";

export function usePlaybackService(): PlaybackService {
  return useEngine().playback;
}
