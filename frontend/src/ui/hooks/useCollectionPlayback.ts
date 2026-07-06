import { useCallback } from "react";

import type { VibeCollection, VibeTrack } from "@/model/vibe";
import { firstPlayableCollectionTrack } from "@/model/track-actions";

/**
 * "Play a collection's first playable track" behavior, shared by the card
 * screens (For You / Search / Artist). Both callbacks are stable, so the
 * memoized MediaCard / CollectionRow they feed stay off the per-render path:
 * pass `canPlayCollection` to the card's `playable` and `playCollection` to its
 * `onPlay`.
 *
 * Reads a collection's own `tracks`. Library is deliberately NOT a consumer — it
 * resolves a collection's tracks per active tab (lazy on the object), so it keeps
 * a local variant over the resolved list.
 */
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
