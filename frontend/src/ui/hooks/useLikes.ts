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

  const mergedSourceRef = useRef<ProviderId | null>(null);
  useEffect(() => {
    const { providerId } = engagement;
    if (!synced) {
      mergedSourceRef.current = null;
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
      if (carried.length === 0) return;
      setLocalLiked((previous) => withoutLikedIds(previous, providerId, carried));
      void qc.invalidateQueries({ queryKey: queryKeys.likedIds(providerId) });
    });
  }, [synced, localLiked, engagement, qc]);

  const currentTrackKey = vibeTrackKey(currentTrack);
  const isLiked = !!(currentTrackKey && liked.has(currentTrackKey));

  return { liked, toggleLike, isLiked };
}
