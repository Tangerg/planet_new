import { useCallback } from "react";
import type { RefObject } from "react";

import type { VibeTrack } from "@/model/adapt";

export function useQueueActions(opts: {
  addToQueue: (track: VibeTrack) => void;
  catalogTracks: readonly VibeTrack[];
  playbackTracks: readonly VibeTrack[];
  queueTracks: readonly VibeTrack[];
  playContext: RefObject<VibeTrack[]>;
}) {
  const { addToQueue, catalogTracks, playbackTracks, queueTracks, playContext } = opts;

  const enqueueById = useCallback(
    (trackId: string) => {
      const candidates = [
        ...(playContext.current ?? []),
        ...playbackTracks,
        ...queueTracks,
        ...catalogTracks,
      ];
      const track = candidates.find((t) => t.id === trackId);
      if (track) addToQueue(track);
    },
    [addToQueue, catalogTracks, playContext, playbackTracks, queueTracks],
  );

  return { enqueueById };
}
