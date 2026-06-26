/**
 * Likes, play history, and settings state — local UI state that doesn't
 * belong in the kernel or application layer. Extracted from Shell.tsx.
 */
import { useEffect, useState } from "react";

import type { VibeTrack } from "@/model/adapt";
import { DEFAULT_SETTINGS, type Settings } from "@/model/defaults";

export function useLikes(currentTrack: VibeTrack | undefined) {
  const currentTrackId = currentTrack?.id;
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<VibeTrack[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const toggleLike = (id: string) =>
    setLiked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });

  const isLiked = !!(currentTrackId && liked.has(currentTrackId));

  // Record play history (dropping consecutive duplicates).
  useEffect(() => {
    if (!currentTrackId || !currentTrack) return;
    setHistory((h) => (h[h.length - 1]?.id === currentTrackId ? h : [...h, currentTrack]));
  }, [currentTrackId, currentTrack]);

  return { liked, toggleLike, isLiked, history, settings, setSettings };
}
