import { useState } from "react";

import { appendPlayHistoryTrack } from "@/model/play-history";
import type { VibeTrack } from "@/model/vibe";

/** Session-local play history. Provider-backed week/all-time records stay in EngagementService. */
export function usePlayHistory(currentTrack: VibeTrack | undefined): readonly VibeTrack[] {
  const currentTrackId = currentTrack?.id;
  const [history, setHistory] = useState<readonly VibeTrack[]>([]);

  /* Appending is a reaction to the track prop changing, not a synchronisation
     with an external system, so it is adjusted during render: an effect would
     paint the new track against the previous history first and then re-render. */
  const [recorded, setRecorded] = useState<string | null | undefined>(null);
  if (recorded !== currentTrackId) {
    setRecorded(currentTrackId);
    if (currentTrackId && currentTrack) {
      setHistory((previous) => appendPlayHistoryTrack(previous, currentTrack));
    }
  }

  return history;
}
