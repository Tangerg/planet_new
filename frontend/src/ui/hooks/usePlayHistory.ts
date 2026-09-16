import { useState } from "react";

import { appendPlayHistoryTrack } from "@/model/play-history";
import type { VibeTrack } from "@/model/vibe";

export function usePlayHistory(currentTrack: VibeTrack | undefined): readonly VibeTrack[] {
  const currentTrackId = currentTrack?.id;
  const [history, setHistory] = useState<readonly VibeTrack[]>([]);

  const [recorded, setRecorded] = useState<string | null | undefined>(null);
  if (recorded !== currentTrackId) {
    setRecorded(currentTrackId);
    if (currentTrackId && currentTrack) {
      setHistory((previous) => appendPlayHistoryTrack(previous, currentTrack));
    }
  }

  return history;
}
