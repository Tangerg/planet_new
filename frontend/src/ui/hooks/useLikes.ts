/**
 * Likes and settings state. Likes are account-backed when the user is logged in
 * to a provider that exposes the Engagement likes gateway (the like set loads from the
 * account and toggles sync back, optimistically); otherwise they stay local UI
 * state. On first login the anonymous session's local likes are merged into the
 * account. Settings remain local.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { DEFAULT_SETTINGS, type Settings } from "@/model/defaults";
import { useAuth } from "@/hooks/useAuth";
import { useEngagementService } from "@/hooks/useEngagementService";
import { queryKeys } from "@/model/queryKeys";
import {
  likesAreAccountBacked,
  likeSyncMergePlan,
  likedSetForSource,
  optimisticLikeUpdate,
  toggleLocalLiked,
  withoutLikedSource,
} from "@/model/likes";
import { vibeTrackKey, type VibeTrack } from "@/model/vibe";
import { warnWriteFailure } from "@shared/debug";
import type { ProviderId } from "@contexts/contracts";
import { queryDataOr } from "@/model/application-query";

export function useLikes(currentTrack: VibeTrack | undefined) {
  const engagement = useEngagementService();
  const { loggedIn } = useAuth();
  const qc = useQueryClient();
  // Account-backed likes only when logged in to a likes-capable provider.
  const synced = likesAreAccountBacked(loggedIn, engagement.availability.likes);

  const [localLiked, setLocalLiked] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const { data: accountIds } = useQuery({
    queryKey: queryKeys.likedIds(engagement.providerId),
    queryFn: async () => queryDataOr(await engagement.likedTrackIds(), []),
    enabled: synced,
  });

  const liked = useMemo<Set<string>>(
    () => likedSetForSource({ providerId: engagement.providerId, accountIds, localLiked, synced }),
    [synced, accountIds, localLiked, engagement.providerId],
  );

  const toggleLike = useCallback(
    (track: VibeTrack) => {
      const trackKey = vibeTrackKey(track);
      if (!trackKey) return;
      if (synced && track.providerId === engagement.providerId) {
        // Optimistic: flip the cached id list, fire the sync, let it settle.
        const key = queryKeys.likedIds(engagement.providerId);
        const cur = qc.getQueryData<string[]>(key) ?? [];
        const { ids, willLike } = optimisticLikeUpdate(cur, track.id);
        qc.setQueryData<string[]>(key, ids);
        void engagement.setLiked(track.id, willLike).catch((error) => {
          warnWriteFailure(`${engagement.providerId}.setLiked(${track.id})`, error);
          void qc.invalidateQueries({ queryKey: key });
        });
      } else {
        setLocalLiked((prev) => toggleLocalLiked(prev, trackKey));
      }
    },
    [synced, qc, engagement],
  );

  // First login: fold the anonymous session's local likes into the account
  // (push each, then clear local so the synced set becomes the source of truth).
  // Guarded by a ref so it runs once per login transition, never in a loop.
  const mergedSourceRef = useRef<ProviderId | null>(null);
  useEffect(() => {
    const plan = likeSyncMergePlan({
      providerId: engagement.providerId,
      localLiked,
      mergedThisSession: mergedSourceRef.current === engagement.providerId,
      synced,
    });
    mergedSourceRef.current = plan.mergedThisSession ? engagement.providerId : null;
    if (plan.idsToSync.length === 0) return;
    void Promise.all(
      plan.idsToSync.map((id) =>
        engagement.setLiked(id, true).catch((error) => {
          warnWriteFailure(`${engagement.providerId}.setLiked(${id})`, error);
        }),
      ),
    ).then(() => {
      setLocalLiked((previous) => withoutLikedSource(previous, engagement.providerId));
      void qc.invalidateQueries({ queryKey: queryKeys.likedIds(engagement.providerId) });
    });
  }, [synced, localLiked, engagement, qc]);

  const currentTrackKey = vibeTrackKey(currentTrack);
  const isLiked = !!(currentTrackKey && liked.has(currentTrackKey));

  return { liked, toggleLike, isLiked, settings, setSettings };
}
