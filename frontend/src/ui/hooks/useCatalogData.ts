import { useCallback } from "react";

import { useMediaService } from "@/hooks/useMediaService";
import { toVibeSearchResults } from "@/model/adapters/search";
import type { SearchResults, VibeCollection } from "@/model/vibe";
import { catalogScreenData, toVibeCharts } from "@/model/catalog";
import { queryKeys } from "@/model/queryKeys";
import { useProjectedQuery } from "@/hooks/useProjectedQuery";

export function useCatalog() {
  const media = useMediaService();
  const { data: catalog, isLoading } = useProjectedQuery({
    queryKey: queryKeys.personalized(media.providerName),
    queryFn: () => media.personalized(),
    project: catalogScreenData,
  });
  return { catalog, isLoading };
}

/** Returns a search(query) that calls media.search and projects to vibe shapes. */
export function useProviderSearch() {
  const media = useMediaService();
  return useCallback(
    async (query: string): Promise<SearchResults> => {
      return toVibeSearchResults(await media.search(query));
    },
    [media],
  );
}

/** Chart list in vibe shape, for the Charts grid. */
export function useToplists(): VibeCollection[] {
  const media = useMediaService();
  const { data } = useProjectedQuery({
    queryKey: queryKeys.toplists(media.providerName),
    queryFn: () => media.toplists(),
    project: toVibeCharts,
  });
  return data;
}
