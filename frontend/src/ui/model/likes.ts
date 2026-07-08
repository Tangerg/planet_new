export type OptimisticLikeUpdate = {
  ids: string[];
  willLike: boolean;
};

export type LikeSyncMergePlan = {
  idsToSync: string[];
  mergedThisSession: boolean;
};

export function likesAreAccountBacked(loggedIn: boolean, librarySupported: boolean): boolean {
  return loggedIn && librarySupported;
}

export function likedSetForSource({
  accountIds,
  localLiked,
  synced,
}: {
  accountIds?: readonly string[];
  localLiked: ReadonlySet<string>;
  synced: boolean;
}): Set<string> {
  return synced ? new Set(accountIds ?? []) : new Set(localLiked);
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
  localLiked,
  mergedThisSession,
  synced,
}: {
  localLiked: ReadonlySet<string>;
  mergedThisSession: boolean;
  synced: boolean;
}): LikeSyncMergePlan {
  if (!synced) return { idsToSync: [], mergedThisSession: false };
  if (mergedThisSession) return { idsToSync: [], mergedThisSession: true };
  return {
    idsToSync: [...localLiked],
    mergedThisSession: true,
  };
}
