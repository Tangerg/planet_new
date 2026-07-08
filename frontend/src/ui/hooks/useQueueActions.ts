import { useCallback } from "react";
import type { RefObject } from "react";

import type { VibeTrack } from "@/model/vibe";
import { findQueueTrack } from "@/model/track-actions";

export function useQueueActions(opts: {
  addToQueue: (track: VibeTrack) => void;
  addNextToQueue: (track: VibeTrack) => void;
  catalogTracks: readonly VibeTrack[];
  playbackTracks: readonly VibeTrack[];
  queueTracks: readonly VibeTrack[];
  playContext: RefObject<VibeTrack[]>;
}) {
  const { addToQueue, addNextToQueue, catalogTracks, playbackTracks, queueTracks, playContext } =
    opts;

  const enqueueById = useCallback(
    (trackId: string, next = false) => {
      const track = findQueueTrack(trackId, {
        catalogTracks,
        playContext: playContext.current ?? [],
        playbackTracks,
        queueTracks,
      });
      if (!track) return;
      if (next) addNextToQueue(track);
      else addToQueue(track);
    },
    [addNextToQueue, addToQueue, catalogTracks, playContext, playbackTracks, queueTracks],
  );

  return { enqueueById };
}
