import type { Lyric } from "@contexts/playback";

import { useEngagementService } from "@/hooks/useEngagementService";
import { usePlayQueueStore } from "@/store/playqueue";
import { toVibeComments } from "@/model/adapters/comment";
import { trackCommentsQueryEnabled } from "@/model/content-query";
import type { VibeComment } from "@/model/vibe";
import { queryKeys } from "@/model/queryKeys";
import { useProjectedResultQuery } from "@/hooks/useProjectedQuery";

export function useLyric(): readonly Lyric[] {
  return usePlayQueueStore.use.lyric();
}

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
