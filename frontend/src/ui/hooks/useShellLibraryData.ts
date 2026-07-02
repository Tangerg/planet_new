import { useMemo } from "react";

import type { VibeArtist } from "@/model/vibe";
import { useCatalog, useProviderSearch, useToplists } from "@/hooks/useCatalogData";
import { useDailyRecommendations, usePlayRecord, useUserPlaylists } from "@/hooks/useLibraryData";
import { useMusicVideoDiscovery } from "@/hooks/useMusicVideoData";
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
    () => (loggedIn && userPlaylists.length ? { ...catalog, playlists: userPlaylists } : catalog),
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
