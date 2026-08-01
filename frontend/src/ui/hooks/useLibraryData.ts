import type { QueryKey } from "@tanstack/react-query";
import type { LibraryService } from "@contexts/account-library";
import type { ProviderId, QueryResult } from "@contexts/contracts";

import { useLibraryService } from "@/hooks/useLibraryService";
import { useMediaService } from "@/hooks/useMediaService";
import { useAuthStore } from "@/store/auth";
import { toVibePlaylists } from "@/model/adapters/collection";
import { toVibeTracks } from "@/model/adapters/track";
import { userLibraryQueryEnabled } from "@/model/content-query";
import type { VibeCollection, VibeTrack } from "@/model/vibe";
import { queryKeys } from "@/model/queryKeys";
import { useProjectedResultQuery } from "@/hooks/useProjectedQuery";

type AccountLibraryQueryOptions<TQueryData, TView, TQueryKey extends QueryKey> = {
  queryKey: (providerId: ProviderId) => TQueryKey;
  queryFn: (library: LibraryService) => Promise<QueryResult<TQueryData>>;
  fallback: TQueryData;
  project: (data: TQueryData | undefined) => TView;
};

function useAccountLibraryQuery<TQueryData, TView, TQueryKey extends QueryKey>({
  queryKey,
  queryFn,
  fallback,
  project,
}: AccountLibraryQueryOptions<TQueryData, TView, TQueryKey>) {
  const library = useLibraryService();
  const media = useMediaService();
  const loggedIn = useAuthStore((state) => state.loggedIn);
  const enabled = userLibraryQueryEnabled(loggedIn, library.supported);

  return useProjectedResultQuery({
    queryKey: queryKey(media.providerId),
    queryFn: () => queryFn(library),
    fallback,
    enabled,
    project,
  });
}

export function useUserPlaylists(): VibeCollection[] {
  const { data } = useAccountLibraryQuery({
    queryKey: queryKeys.userPlaylists,
    queryFn: (library) => library.userPlaylists(),
    fallback: [],
    project: toVibePlaylists,
  });
  return data;
}

export function useDailyRecommendations(): VibeTrack[] {
  const { data } = useAccountLibraryQuery({
    queryKey: queryKeys.dailyRecommendations,
    queryFn: (library) => library.dailyRecommendations(),
    fallback: [],
    project: toVibeTracks,
  });
  return data;
}
