import type { PlaybackService } from "@core";
import { useEngine } from "./useEngine";

/**
 * The playback use-case service from the Engine. UI components delegate all
 * playback commands (play / togglePlay / next / prev / seek / setVolume /
 * toggleShuffle / toggleRepeat) here and never touch the provider or event bus.
 */
export function usePlaybackService(): PlaybackService {
  return useEngine().playback;
}
