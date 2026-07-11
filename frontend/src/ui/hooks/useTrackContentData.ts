import type { Lyric } from "@contexts/playback";

import { useEngagementService } from "@/hooks/useEngagementService";
import { usePlayQueueStore } from "@/store/playqueue";
import { toVibeComments } from "@/model/adapters/comment";
import { trackCommentsQueryEnabled } from "@/model/content-query";
import type { VibeComment } from "@/model/vibe";
import { queryKeys } from "@/model/queryKeys";
import { useProjectedResultQuery } from "@/hooks/useProjectedQuery";

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
  const engagement = useEngagementService();
  const { data } = useProjectedResultQuery({
    queryKey: queryKeys.comments(engagement.providerId, trackId),
    queryFn: () => engagement.comments(trackId ?? ""),
    fallback: [],
    enabled: trackCommentsQueryEnabled(trackId, enabled, engagement.availability.trackComments),
    project: toVibeComments,
  });
  return data;
}
