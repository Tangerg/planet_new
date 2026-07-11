import { useEffect, useState } from "react";

import { appendPlayHistoryTrack } from "@/model/play-history";
import type { VibeTrack } from "@/model/vibe";

/** Session-local play history. Provider-backed week/all-time records stay in EngagementService. */
export function usePlayHistory(currentTrack: VibeTrack | undefined): readonly VibeTrack[] {
  const currentTrackId = currentTrack?.id;
  const [history, setHistory] = useState<readonly VibeTrack[]>([]);

  useEffect(() => {
    if (!currentTrackId || !currentTrack) return;
    setHistory((previous) => appendPlayHistoryTrack(previous, currentTrack));
  }, [currentTrackId, currentTrack]);

  return history;
}
