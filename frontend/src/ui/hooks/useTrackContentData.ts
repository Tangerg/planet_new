import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { Lyric } from "@domain/model/lyric";

import { useMediaService } from "@/hooks/useMediaService";
import { usePlayQueueStore } from "@/store/playqueue";
import { toVibeComment, type VibeComment } from "@/model/adapt";
import { queryKeys } from "@/model/queryKeys";

/**
 * Current-track lyrics ([] when none). The Lyrics plugin follows
 * queue:current-changed and writes domain Lyric lines into the store; the UI
 * renders them directly (no separate view-model for the same concept).
 */
export function useLyric(): readonly Lyric[] {
  return usePlayQueueStore.use.lyric();
}

/**
 * Track comments in vibe shape. Gated by capability and screen visibility so
 * we never fetch comments for every played track.
 */
export function useComments(trackId: string | undefined, enabled: boolean): VibeComment[] {
  const media = useMediaService();
  const { data } = useQuery({
    queryKey: queryKeys.comments(media.providerName, trackId),
    queryFn: () => media.comments(trackId ?? ""),
    enabled: enabled && !!trackId && media.supports("comments"),
  });
  return useMemo(() => (data ?? []).map(toVibeComment), [data]);
}
