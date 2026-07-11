import { useCallback } from "react";

import { useMediaService } from "@/hooks/useMediaService";
import { toVibeSearchResults } from "@/model/adapters/search";
import { SearchResult } from "@contexts/catalog";
import { queryDataOr } from "@/model/application-query";
import type { SearchResults, VibeCollection } from "@/model/vibe";
import { catalogScreenData, toVibeCharts } from "@/model/catalog";
import { queryKeys } from "@/model/queryKeys";
import { useProjectedResultQuery } from "@/hooks/useProjectedQuery";

export function useCatalog() {
  const media = useMediaService();
  const { data: catalog, isLoading } = useProjectedResultQuery({
    queryKey: queryKeys.personalized(media.providerId),
    queryFn: () => media.personalized(),
    fallback: { playlists: [] },
    project: catalogScreenData,
  });
  return { catalog, isLoading };
}

/** Returns a search(query) that calls media.search and projects to vibe shapes. */
export function useProviderSearch() {
  const media = useMediaService();
  return useCallback(
    async (query: string): Promise<SearchResults> => {
      return toVibeSearchResults(queryDataOr(await media.search(query), SearchResult.empty()));
    },
    [media],
  );
}

/** Chart list in vibe shape, for the Charts grid. */
export function useToplists(): VibeCollection[] {
  const media = useMediaService();
  const { data } = useProjectedResultQuery({
    queryKey: queryKeys.toplists(media.providerId),
    queryFn: () => media.toplists(),
    fallback: [],
    project: toVibeCharts,
  });
  return data;
}
