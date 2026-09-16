import { useCallback } from "react";

import type { VibeCollection, VibeTrack } from "@/model/vibe";
import { firstPlayableCollectionTrack } from "@/model/track-actions";

export function useCollectionPlayback(onPlay: (track: VibeTrack) => void) {
  const playCollection = useCallback(
    (collection: Pick<VibeCollection, "tracks">) => {
      const track = firstPlayableCollectionTrack(collection);
      if (track) onPlay(track);
    },
    [onPlay],
  );
  const canPlayCollection = useCallback(
    (collection: Pick<VibeCollection, "tracks">) =>
      Boolean(firstPlayableCollectionTrack(collection)),
    [],
  );
  return { playCollection, canPlayCollection };
}
