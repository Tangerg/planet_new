import { usePlayQueueStore } from "@/store/playqueue";

export function usePlaybackProgress(): { positionSec: number; durationSec: number } {
  const progress = usePlayQueueStore.use.progress();
  const duration = usePlayQueueStore.use.duration();
  return { positionSec: progress.duration, durationSec: duration.duration };
}
