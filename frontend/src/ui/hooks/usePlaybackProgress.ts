import { usePlayQueueStore } from "@/store/playqueue";

/**
 * The live playback clock (current position + total duration), in seconds.
 *
 * Deliberately its own hook: the kernel pushes progress several times a second,
 * so whoever subscribes re-renders that often. Only the player-bar scrubber and
 * Now Playing show the clock, so they subscribe here directly — keeping the
 * frequent tick out of Shell, whose re-render would cascade into every mounted
 * screen (and every visible list row).
 */
export function usePlaybackProgress(): { positionSec: number; durationSec: number } {
  const progress = usePlayQueueStore.use.progress();
  const duration = usePlayQueueStore.use.duration();
  return { positionSec: progress.duration, durationSec: duration.duration };
}
