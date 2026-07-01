import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useLibraryService } from "@/hooks/useLibraryService";
import { useMediaService } from "@/hooks/useMediaService";
import { useAuthStore } from "@/store/auth";
import { toVibePlaylist, toVibeTracks, type VibeCollection, type VibeTrack } from "@/model/adapt";
import { queryKeys } from "@/model/queryKeys";

export function useUserPlaylists(): VibeCollection[] {
  const library = useLibraryService();
  const media = useMediaService();
  const loggedIn = useAuthStore((state) => state.loggedIn);
  const { data } = useQuery({
    queryKey: queryKeys.userPlaylists(media.providerName),
    queryFn: () => library.userPlaylists(),
    enabled: loggedIn && library.supported,
  });
  return useMemo(() => (data ?? []).map(toVibePlaylist), [data]);
}

export function usePlayRecord(): { week: VibeTrack[]; all: VibeTrack[] } {
  const library = useLibraryService();
  const media = useMediaService();
  const loggedIn = useAuthStore((state) => state.loggedIn);
  const enabled = loggedIn && library.supported;
  const week = useQuery({
    queryKey: queryKeys.playRecord(media.providerName, "week"),
    queryFn: () => library.playRecord("week"),
    enabled,
  });
  const all = useQuery({
    queryKey: queryKeys.playRecord(media.providerName, "all"),
    queryFn: () => library.playRecord("all"),
    enabled,
  });
  return useMemo(
    () => ({ week: toVibeTracks(week.data), all: toVibeTracks(all.data) }),
    [week.data, all.data],
  );
}

export function useDailyRecommendations(): VibeTrack[] {
  const library = useLibraryService();
  const media = useMediaService();
  const loggedIn = useAuthStore((state) => state.loggedIn);
  const { data } = useQuery({
    queryKey: queryKeys.dailyRecommendations(media.providerName),
    queryFn: () => library.dailyRecommendations(),
    enabled: loggedIn && library.supported,
  });
  return useMemo(() => toVibeTracks(data), [data]);
}
