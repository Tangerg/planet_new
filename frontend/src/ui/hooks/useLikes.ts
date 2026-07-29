/**
 * Likes state. Account-backed when the user is logged in to a provider that
 * exposes the Engagement likes gateway (the like set loads from the account and
 * toggles sync back, optimistically); otherwise they stay local UI state. On
 * first login the anonymous session's local likes are merged into the account.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { useEngagementService } from "@/hooks/useEngagementService";
import { queryKeys } from "@/model/queryKeys";
import {
  likesAreAccountBacked,
  likesToMerge,
  likedSetForSource,
  optimisticLikeUpdate,
  toggleLocalLiked,
  withoutLikedIds,
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

  // First login: fold the anonymous session's local likes into the account.
  // A like stops being local only once the account has actually taken it —
  // while synced, local likes for this provider are hidden behind the account
  // set, so dropping an unsynced one would erase it. The ref marks the carry
  // done for this login so a settled session does no repeat work.
  const mergedSourceRef = useRef<ProviderId | null>(null);
  useEffect(() => {
    const { providerId } = engagement;
    if (!synced) {
      mergedSourceRef.current = null; // a later login carries whatever was liked meanwhile
      return;
    }
    const owed = likesToMerge({
      providerId,
      localLiked,
      alreadyMerged: mergedSourceRef.current === providerId,
      synced,
    });
    if (owed.length === 0) {
      mergedSourceRef.current = providerId;
      return;
    }
    void Promise.all(
      owed.map(async (id) => {
        try {
          await engagement.setLiked(id, true);
          return id;
        } catch (error) {
          warnWriteFailure(`${providerId}.setLiked(${id})`, error);
          return undefined;
        }
      }),
    ).then((results) => {
      const carried = results.filter((id) => id !== undefined);
      if (carried.length === owed.length) mergedSourceRef.current = providerId;
      if (carried.length === 0) return; // nothing landed: keep the likes, retry on the next change
      setLocalLiked((previous) => withoutLikedIds(previous, providerId, carried));
      void qc.invalidateQueries({ queryKey: queryKeys.likedIds(providerId) });
    });
  }, [synced, localLiked, engagement, qc]);

  const currentTrackKey = vibeTrackKey(currentTrack);
  const isLiked = !!(currentTrackKey && liked.has(currentTrackKey));

  return { liked, toggleLike, isLiked };
}
