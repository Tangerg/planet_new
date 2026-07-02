import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useMediaService } from "@/hooks/useMediaService";
import { toVibeAlbum, toVibePlaylist } from "@/model/adapters/collection";
import { toVibeArtist } from "@/model/adapters/artist";
import { toVibeTracks } from "@/model/adapters/track";
import type { SearchResults, VibeCollection } from "@/model/vibe";
import { catalogScreenData, toVibeCharts } from "@/model/catalog";
import { queryKeys } from "@/model/queryKeys";

export function useCatalog() {
  const media = useMediaService();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.personalized(media.providerName),
    queryFn: () => media.personalized(),
  });
  const catalog = useMemo(() => catalogScreenData(data), [data]);
  return { catalog, isLoading };
}

/** Returns a search(query) that calls media.search and projects to vibe shapes. */
export function useProviderSearch() {
  const media = useMediaService();
  return useCallback(
    async (query: string): Promise<SearchResults> => {
      const result = await media.search(query);
      return {
        tracks: toVibeTracks(result.tracks),
        artists: (result.artists ?? []).map(toVibeArtist),
        albums: (result.albums ?? []).map(toVibeAlbum),
        playlists: (result.playlists ?? []).map(toVibePlaylist),
      };
    },
    [media],
  );
}

/** Chart list in vibe shape, for the Charts grid. */
export function useToplists(): VibeCollection[] {
  const media = useMediaService();
  const { data } = useQuery({
    queryKey: queryKeys.toplists(media.providerName),
    queryFn: () => media.toplists(),
  });
  return useMemo<VibeCollection[]>(() => toVibeCharts(data), [data]);
}
