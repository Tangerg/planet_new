export type OptimisticLikeUpdate = {
  ids: string[];
  willLike: boolean;
};

export type LikeSyncMergePlan = {
  idsToSync: string[];
  mergedThisSession: boolean;
};

export function likesAreAccountBacked(loggedIn: boolean, likesSupported: boolean): boolean {
  return loggedIn && likesSupported;
}

export function likedSetForSource({
  providerId,
  accountIds,
  localLiked,
  synced,
}: {
  providerId: ProviderId;
  accountIds?: readonly string[];
  localLiked: ReadonlySet<string>;
  synced: boolean;
}): Set<string> {
  const liked = new Set<string>();
  for (const key of localLiked) {
    if (synced && TrackKey.parse(key).providerId === providerId) continue;
    liked.add(key);
  }
  if (synced) {
    for (const id of accountIds ?? []) {
      if (id) liked.add(TrackKey.of(providerId, id));
    }
  }
  return liked;
}

export function isVibeTrackLiked(
  liked: ReadonlySet<string>,
  track: Pick<VibeTrack, "providerId" | "id"> | null | undefined,
): boolean {
  const key = vibeTrackKey(track);
  return key ? liked.has(key) : false;
}

export function toggleLikedId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function willLikeId(ids: ReadonlySet<string> | readonly string[], id: string): boolean {
  return "has" in ids ? !ids.has(id) : !ids.includes(id);
}

export function optimisticLikeUpdate(ids: readonly string[], id: string): OptimisticLikeUpdate {
  return {
    ids: toggleLikedId(ids, id),
    willLike: willLikeId(ids, id),
  };
}

export function toggleLocalLiked(prev: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(prev);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function likeSyncMergePlan({
  providerId,
  localLiked,
  mergedThisSession,
  synced,
}: {
  providerId: ProviderId;
  localLiked: ReadonlySet<string>;
  mergedThisSession: boolean;
  synced: boolean;
}): LikeSyncMergePlan {
  if (!synced) return { idsToSync: [], mergedThisSession: false };
  if (mergedThisSession) return { idsToSync: [], mergedThisSession: true };
  return {
    idsToSync: [...localLiked]
      .map((key) => TrackKey.parse(key))
      .filter((parts) => parts.providerId === providerId)
      .map((parts) => parts.localId),
    mergedThisSession: true,
  };
}

export function withoutLikedSource(
  liked: ReadonlySet<string>,
  providerId: ProviderId,
): Set<string> {
  return new Set([...liked].filter((key) => TrackKey.parse(key).providerId !== providerId));
}
import { TrackKey, type ProviderId } from "@contexts/contracts";
import { vibeTrackKey, type VibeTrack } from "./vibe";
