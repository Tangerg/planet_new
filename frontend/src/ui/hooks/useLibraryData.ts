import { useMemo } from "react";
import type { QueryKey } from "@tanstack/react-query";
import type { LibraryService } from "@core";

import { useLibraryService } from "@/hooks/useLibraryService";
import { useMediaService } from "@/hooks/useMediaService";
import { useAuthStore } from "@/store/auth";
import { toVibePlaylists } from "@/model/adapters/collection";
import { toVibeTracks } from "@/model/adapters/track";
import { userLibraryQueryEnabled } from "@/model/content-query";
import type { VibeCollection, VibeTrack } from "@/model/vibe";
import { queryKeys } from "@/model/queryKeys";
import { useProjectedQuery } from "@/hooks/useProjectedQuery";

type AccountLibraryQueryOptions<TQueryData, TView, TQueryKey extends QueryKey> = {
  queryKey: (providerName: string) => TQueryKey;
  queryFn: (library: LibraryService) => Promise<TQueryData>;
  project: (data: TQueryData | undefined) => TView;
};

function useAccountLibraryQuery<TQueryData, TView, TQueryKey extends QueryKey>({
  queryKey,
  queryFn,
  project,
}: AccountLibraryQueryOptions<TQueryData, TView, TQueryKey>) {
  const library = useLibraryService();
  const media = useMediaService();
  const loggedIn = useAuthStore((state) => state.loggedIn);
  const enabled = userLibraryQueryEnabled(loggedIn, library.supported);

  return useProjectedQuery({
    queryKey: queryKey(media.providerName),
    queryFn: () => queryFn(library),
    enabled,
    project,
  });
}

export function useUserPlaylists(): VibeCollection[] {
  const { data } = useAccountLibraryQuery({
    queryKey: queryKeys.userPlaylists,
    queryFn: (library) => library.userPlaylists(),
    project: toVibePlaylists,
  });
  return data;
}

export function usePlayRecord(): { week: VibeTrack[]; all: VibeTrack[] } {
  const week = useAccountLibraryQuery({
    queryKey: (providerName) => queryKeys.playRecord(providerName, "week"),
    queryFn: (library) => library.playRecord("week"),
    project: toVibeTracks,
  });
  const all = useAccountLibraryQuery({
    queryKey: (providerName) => queryKeys.playRecord(providerName, "all"),
    queryFn: (library) => library.playRecord("all"),
    project: toVibeTracks,
  });
  return useMemo(() => ({ week: week.data, all: all.data }), [week.data, all.data]);
}

export function useDailyRecommendations(): VibeTrack[] {
  const { data } = useAccountLibraryQuery({
    queryKey: queryKeys.dailyRecommendations,
    queryFn: (library) => library.dailyRecommendations(),
    project: toVibeTracks,
  });
  return data;
}
