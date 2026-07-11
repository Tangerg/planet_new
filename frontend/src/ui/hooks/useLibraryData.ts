import type { QueryKey } from "@tanstack/react-query";
import type { LibraryService } from "@contexts/account-library";
import type { ProviderId } from "@contexts/contracts";

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
  queryKey: (providerId: ProviderId) => TQueryKey;
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
    queryKey: queryKey(media.providerId),
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

export function useDailyRecommendations(): VibeTrack[] {
  const { data } = useAccountLibraryQuery({
    queryKey: queryKeys.dailyRecommendations,
    queryFn: (library) => library.dailyRecommendations(),
    project: toVibeTracks,
  });
  return data;
}
