/**
 * Likes, play history, and settings state. Likes are account-backed when the
 * user is logged in to a provider that exposes a user library (the like set
 * loads from the account and toggles sync back, optimistically); otherwise they
 * stay local UI state. On first login the anonymous session's local likes are
 * merged into the account. History and settings remain local.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { VibeTrack } from "@/model/adapt";
import { DEFAULT_SETTINGS, type Settings } from "@/model/defaults";
import { useAuth } from "@/hooks/useAuth";
import { useLibraryService } from "@/hooks/useLibraryService";
import { useMediaService } from "@/hooks/useMediaService";

export function useLikes(currentTrack: VibeTrack | undefined) {
  const currentTrackId = currentTrack?.id;
  const library = useLibraryService();
  const media = useMediaService();
  const { loggedIn } = useAuth();
  const qc = useQueryClient();
  // Account-backed likes only when logged in to a library-capable provider.
  const synced = loggedIn && library.supported;

  const [localLiked, setLocalLiked] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<VibeTrack[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const { data: accountIds } = useQuery({
    queryKey: ["likedIds", media.providerName],
    queryFn: () => library.likedTrackIds(),
    enabled: synced,
  });

  const liked = useMemo<Set<string>>(
    () => (synced ? new Set(accountIds ?? []) : localLiked),
    [synced, accountIds, localLiked],
  );

  const toggleLike = useCallback(
    (id: string) => {
      if (synced) {
        // Optimistic: flip the cached id list, fire the sync, let it settle.
        const key = ["likedIds", media.providerName];
        const cur = qc.getQueryData<string[]>(key) ?? [];
        const willLike = !cur.includes(id);
        qc.setQueryData<string[]>(key, willLike ? [...cur, id] : cur.filter((x) => x !== id));
        void library.setLiked(id, willLike).catch(() => qc.invalidateQueries({ queryKey: key }));
      } else {
        setLocalLiked((prev) => {
          const n = new Set(prev);
          if (n.has(id)) n.delete(id);
          else n.add(id);
          return n;
        });
      }
    },
    [synced, qc, library, media.providerName],
  );

  // First login: fold the anonymous session's local likes into the account
  // (push each, then clear local so the synced set becomes the source of truth).
  // Guarded by a ref so it runs once per login transition, never in a loop.
  const mergedRef = useRef(false);
  useEffect(() => {
    if (!synced) {
      mergedRef.current = false;
      return;
    }
    if (mergedRef.current) return;
    mergedRef.current = true;
    if (localLiked.size === 0) return;
    const ids = [...localLiked];
    void Promise.all(ids.map((id) => library.setLiked(id, true).catch(() => {}))).then(() => {
      setLocalLiked(new Set());
      void qc.invalidateQueries({ queryKey: ["likedIds", media.providerName] });
    });
  }, [synced, localLiked, library, qc, media.providerName]);

  const isLiked = !!(currentTrackId && liked.has(currentTrackId));

  // Record play history (dropping consecutive duplicates).
  useEffect(() => {
    if (!currentTrackId || !currentTrack) return;
    setHistory((h) => (h[h.length - 1]?.id === currentTrackId ? h : [...h, currentTrack]));
  }, [currentTrackId, currentTrack]);

  return { liked, toggleLike, isLiked, history, settings, setSettings };
}
