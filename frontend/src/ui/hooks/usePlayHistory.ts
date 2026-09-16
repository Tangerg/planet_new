import { useState } from "react";

import { appendPlayHistoryTrack } from "@/model/play-history";
import type { VibeTrack } from "@/model/vibe";

/** Session-local play history. Provider-backed week/all-time records stay in EngagementService. */
export function usePlayHistory(currentTrack: VibeTrack | undefined): readonly VibeTrack[] {
  const currentTrackId = currentTrack?.id;
  const [history, setHistory] = useState<readonly VibeTrack[]>([]);

  // Adjusted during render, not in an effect: an effect would paint the new
  // track against the old history first.
  const [recorded, setRecorded] = useState<string | null | undefined>(null);
  if (recorded !== currentTrackId) {
    setRecorded(currentTrackId);
    if (currentTrackId && currentTrack) {
      setHistory((previous) => appendPlayHistoryTrack(previous, currentTrack));
    }
  }

  return history;
}
