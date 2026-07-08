import { useEffect, useState } from "react";

import { appendPlayHistoryTrack } from "@/model/play-history";
import type { VibeTrack } from "@/model/vibe";

/** Session-local play history. Account-backed week/all-time records stay in LibraryService. */
export function usePlayHistory(currentTrack: VibeTrack | undefined): VibeTrack[] {
  const currentTrackId = currentTrack?.id;
  const [history, setHistory] = useState<VibeTrack[]>([]);

  useEffect(() => {
    if (!currentTrackId || !currentTrack) return;
    setHistory((previous) => appendPlayHistoryTrack(previous, currentTrack));
  }, [currentTrackId, currentTrack]);

  return history;
}
