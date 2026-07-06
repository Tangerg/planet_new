/**
 * Likes, play history, and settings state. Likes are account-backed when the
 * user is logged in to a provider that exposes a user library (the like set
 * loads from the account and toggles sync back, optimistically); otherwise they
 * stay local UI state. On first login the anonymous session's local likes are
 * merged into the account. History and settings remain local.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { VibeTrack } from "@/model/vibe";
import { DEFAULT_SETTINGS, type Settings } from "@/model/defaults";
import { useAuth } from "@/hooks/useAuth";
import { useLibraryService } from "@/hooks/useLibraryService";
import { useMediaService } from "@/hooks/useMediaService";
import { queryKeys } from "@/model/queryKeys";
import {
  appendHistoryTrack,
  likesAreAccountBacked,
  likeSyncMergePlan,
  likedSetForSource,
  optimisticLikeUpdate,
  toggleLocalLiked,
} from "@/model/likes";
import { warnWriteFailure } from "@shared/debug";

export function useLikes(currentTrack: VibeTrack | undefined) {
  const currentTrackId = currentTrack?.id;
  const library = useLibraryService();
  const media = useMediaService();
  const { loggedIn } = useAuth();
  const qc = useQueryClient();
  // Account-backed likes only when logged in to a library-capable provider.
  const synced = likesAreAccountBacked(loggedIn, library.supported);

  const [localLiked, setLocalLiked] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<VibeTrack[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const { data: accountIds } = useQuery({
    queryKey: queryKeys.likedIds(media.providerName),
    queryFn: () => library.likedTrackIds(),
    enabled: synced,
  });

  const liked = useMemo<Set<string>>(
    () => likedSetForSource({ accountIds, localLiked, synced }),
    [synced, accountIds, localLiked],
  );

  const toggleLike = useCallback(
    (id: string) => {
      if (synced) {
        // Optimistic: flip the cached id list, fire the sync, let it settle.
        const key = queryKeys.likedIds(media.providerName);
        const cur = qc.getQueryData<string[]>(key) ?? [];
        const { ids, willLike } = optimisticLikeUpdate(cur, id);
        qc.setQueryData<string[]>(key, ids);
        void library.setLiked(id, willLike).catch((error) => {
          warnWriteFailure(`${media.providerName}.setLiked(${id})`, error);
          void qc.invalidateQueries({ queryKey: key });
        });
      } else {
        setLocalLiked((prev) => toggleLocalLiked(prev, id));
      }
    },
    [synced, qc, library, media.providerName],
  );

  // First login: fold the anonymous session's local likes into the account
  // (push each, then clear local so the synced set becomes the source of truth).
  // Guarded by a ref so it runs once per login transition, never in a loop.
  const mergedRef = useRef(false);
  useEffect(() => {
    const plan = likeSyncMergePlan({
      localLiked,
      mergedThisSession: mergedRef.current,
      synced,
    });
    mergedRef.current = plan.mergedThisSession;
    if (plan.idsToSync.length === 0) return;
    void Promise.all(
      plan.idsToSync.map((id) =>
        library.setLiked(id, true).catch((error) => {
          warnWriteFailure(`${media.providerName}.setLiked(${id})`, error);
        }),
      ),
    ).then(() => {
      setLocalLiked(new Set());
      void qc.invalidateQueries({ queryKey: queryKeys.likedIds(media.providerName) });
    });
  }, [synced, localLiked, library, qc, media.providerName]);

  const isLiked = !!(currentTrackId && liked.has(currentTrackId));

  // Record play history (dropping consecutive duplicates).
  useEffect(() => {
    if (!currentTrackId || !currentTrack) return;
    setHistory((h) => appendHistoryTrack(h, currentTrack));
  }, [currentTrackId, currentTrack]);

  return { liked, toggleLike, isLiked, history, settings, setSettings };
}
