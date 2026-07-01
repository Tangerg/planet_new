import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Artist } from "@domain/model/artist";

import { useMediaService } from "@/hooks/useMediaService";
import {
  toVibeComment,
  toVibeMusicVideos,
  type VibeArtist,
  type VibeComment,
  type VibeMusicVideo,
} from "@/model/adapt";
import { queryKeys } from "@/model/queryKeys";

export function useMusicVideoDiscovery(artists: VibeArtist[]): {
  videos: VibeMusicVideo[];
  isLoading: boolean;
} {
  const media = useMediaService();
  const artistIds = useMemo(() => Artist.uniqueIds(artists), [artists]);
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.musicVideoDiscovery(media.providerName, artistIds),
    queryFn: () => media.discoverArtistMusicVideos(artists),
    enabled: artistIds.length > 0 && media.supports("artistMusicVideos"),
  });
  return {
    videos: useMemo(() => toVibeMusicVideos(data), [data]),
    isLoading,
  };
}

export function useArtistMusicVideos(
  artistId: string | undefined,
  enabled: boolean,
): VibeMusicVideo[] {
  const media = useMediaService();
  const { data } = useQuery({
    queryKey: queryKeys.artistMusicVideos(media.providerName, artistId),
    queryFn: () => media.artistMusicVideos(artistId ?? ""),
    enabled: enabled && !!artistId && media.supports("artistMusicVideos"),
  });
  return useMemo(() => toVibeMusicVideos(data), [data]);
}

export function useMusicVideoComments(
  musicVideoId: string | undefined,
  enabled: boolean,
): VibeComment[] {
  const media = useMediaService();
  const { data } = useQuery({
    queryKey: queryKeys.musicVideoComments(media.providerName, musicVideoId),
    queryFn: () => media.musicVideoComments(musicVideoId ?? ""),
    enabled: enabled && !!musicVideoId && media.supports("musicVideoComments"),
  });
  return useMemo(() => (data ?? []).map(toVibeComment), [data]);
}
