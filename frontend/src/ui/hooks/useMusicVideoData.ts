import { useMemo } from "react";

import { Artist } from "@domain/model/artist";

import { useMediaService } from "@/hooks/useMediaService";
import { toVibeComments } from "@/model/adapters/comment";
import { toVibeMusicVideos } from "@/model/adapters/music-video";
import {
  artistMusicVideoDiscoveryQueryEnabled,
  artistMusicVideosQueryEnabled,
  musicVideoCommentsQueryEnabled,
} from "@/model/content-query";
import type { VibeArtist, VibeComment, VibeMusicVideo } from "@/model/vibe";
import { queryKeys } from "@/model/queryKeys";
import { useProjectedQuery } from "@/hooks/useProjectedQuery";

export function useMusicVideoDiscovery(artists: VibeArtist[]): {
  videos: VibeMusicVideo[];
  isLoading: boolean;
} {
  const media = useMediaService();
  const artistIds = useMemo(() => Artist.uniqueIds(artists), [artists]);
  const { data: videos, isLoading } = useProjectedQuery({
    queryKey: queryKeys.musicVideoDiscovery(media.providerName, artistIds),
    queryFn: () => media.discoverArtistMusicVideos(artists),
    enabled: artistMusicVideoDiscoveryQueryEnabled(artistIds, (cap) => media.supports(cap)),
    project: toVibeMusicVideos,
  });
  return {
    videos,
    isLoading,
  };
}

export function useArtistMusicVideos(
  artistId: string | undefined,
  enabled: boolean,
): VibeMusicVideo[] {
  const media = useMediaService();
  const { data } = useProjectedQuery({
    queryKey: queryKeys.artistMusicVideos(media.providerName, artistId),
    queryFn: () => media.artistMusicVideos(artistId ?? ""),
    enabled: artistMusicVideosQueryEnabled(artistId, enabled, (cap) => media.supports(cap)),
    project: toVibeMusicVideos,
  });
  return data;
}

export function useMusicVideoComments(
  musicVideoId: string | undefined,
  enabled: boolean,
): VibeComment[] {
  const media = useMediaService();
  const { data } = useProjectedQuery({
    queryKey: queryKeys.musicVideoComments(media.providerName, musicVideoId),
    queryFn: () => media.musicVideoComments(musicVideoId ?? ""),
    enabled: musicVideoCommentsQueryEnabled(musicVideoId, enabled, (cap) => media.supports(cap)),
    project: toVibeComments,
  });
  return data;
}
