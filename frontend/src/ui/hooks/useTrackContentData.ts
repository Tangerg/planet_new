import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useMediaService } from "@/hooks/useMediaService";
import { usePlayQueueStore } from "@/store/playqueue";
import { toVibeComment, type VibeComment } from "@/model/adapt";
import { queryKeys } from "@/model/queryKeys";

/**
 * Current-track lyrics in the NowPlaying { line, t } shape ([] when none).
 * The Lyrics plugin follows queue:current-changed; the UI only renders state.
 */
export function useLyric() {
  const lyric = usePlayQueueStore.use.lyric();
  return useMemo(
    () => lyric.map((line) => ({ line: line.content, t: line.duration, tr: line.translation })),
    [lyric],
  );
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
