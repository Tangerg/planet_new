import { useMemo } from "react";

import { useEngagementService } from "@/hooks/useEngagementService";
import { useAuthStore } from "@/store/auth";
import { toVibeTracks } from "@/model/adapters/track";
import { queryKeys } from "@/model/queryKeys";
import { useProjectedResultQuery } from "@/hooks/useProjectedQuery";
import type { VibeTrack } from "@/model/vibe";

export function usePlayRecord(): { week: VibeTrack[]; all: VibeTrack[] } {
  const engagement = useEngagementService();
  const loggedIn = useAuthStore((state) => state.loggedIn);
  const enabled = loggedIn && engagement.availability.playHistory;
  const week = useProjectedResultQuery({
    queryKey: queryKeys.playRecord(engagement.providerId, "week"),
    queryFn: () => engagement.playRecord("week"),
    fallback: [],
    enabled,
    project: toVibeTracks,
  });
  const all = useProjectedResultQuery({
    queryKey: queryKeys.playRecord(engagement.providerId, "all"),
    queryFn: () => engagement.playRecord("all"),
    fallback: [],
    enabled,
    project: toVibeTracks,
  });
  return useMemo(() => ({ week: week.data, all: all.data }), [week.data, all.data]);
}
