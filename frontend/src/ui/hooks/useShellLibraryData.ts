import { useMemo } from "react";

import type { VibeArtist } from "@/model/vibe";
import { useCatalog, useProviderSearch, useToplists } from "@/hooks/useCatalogData";
import { useDailyRecommendations, useUserPlaylists } from "@/hooks/useLibraryData";
import { usePlayRecord } from "@/hooks/useEngagementData";
import { useMusicVideoDiscovery } from "@/hooks/useMusicVideoData";
import { shellLibraryData } from "@/model/shell-content";
import { useAuthStore } from "@/store/auth";

export function useShellLibraryData() {
  const { catalog } = useCatalog();
  const toplists = useToplists();
  const search = useProviderSearch();
  const { videos: musicVideos, isLoading: musicVideosLoading } = useMusicVideoDiscovery(
    catalog.artists as VibeArtist[],
  );
  const loggedIn = useAuthStore((state) => state.loggedIn);
  const userPlaylists = useUserPlaylists();
  const libraryData = useMemo(
    () => shellLibraryData(catalog, loggedIn, userPlaylists),
    [loggedIn, userPlaylists, catalog],
  );
  const playRecord = usePlayRecord();
  const daily = useDailyRecommendations();

  return {
    catalog,
    toplists,
    search,
    musicVideos,
    musicVideosLoading,
    loggedIn,
    userPlaylists,
    libraryData,
    playRecord,
    daily,
  };
}
