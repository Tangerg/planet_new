import { useMemo } from "react";

import { Artist } from "@contexts/catalog";

import { useMediaService } from "@/hooks/useMediaService";
import { useEngagementService } from "@/hooks/useEngagementService";
import { toVibeComments } from "@/model/adapters/comment";
import { toVibeMusicVideos } from "@/model/adapters/music-video";
import {
  artistMusicVideoDiscoveryQueryEnabled,
  artistMusicVideosQueryEnabled,
  musicVideoCommentsQueryEnabled,
} from "@/model/content-query";
import type { VibeArtist, VibeComment, VibeMusicVideo } from "@/model/vibe";
import { queryKeys } from "@/model/queryKeys";
import { useProjectedResultQuery } from "@/hooks/useProjectedQuery";

export function useMusicVideoDiscovery(artists: VibeArtist[]): {
  videos: VibeMusicVideo[];
  isLoading: boolean;
} {
  const media = useMediaService();
  const artistIds = useMemo(() => Artist.uniqueIds(artists), [artists]);
  const { data: videos, isLoading } = useProjectedResultQuery({
    queryKey: queryKeys.musicVideoDiscovery(media.providerId, artistIds),
    queryFn: () => media.discoverArtistMusicVideos(artists),
    fallback: [],
    enabled: artistMusicVideoDiscoveryQueryEnabled(artistIds, media.availability.artistMusicVideos),
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
  const { data } = useProjectedResultQuery({
    queryKey: queryKeys.artistMusicVideos(media.providerId, artistId),
    queryFn: () => media.artistMusicVideos(artistId ?? ""),
    fallback: [],
    enabled: artistMusicVideosQueryEnabled(artistId, enabled, media.availability.artistMusicVideos),
    project: toVibeMusicVideos,
  });
  return data;
}

export function useMusicVideoComments(
  musicVideoId: string | undefined,
  enabled: boolean,
): VibeComment[] {
  const engagement = useEngagementService();
  const { data } = useProjectedResultQuery({
    queryKey: queryKeys.musicVideoComments(engagement.providerId, musicVideoId),
    queryFn: () => engagement.musicVideoComments(musicVideoId ?? ""),
    fallback: [],
    enabled: musicVideoCommentsQueryEnabled(
      musicVideoId,
      enabled,
      engagement.availability.musicVideoComments,
    ),
    project: toVibeComments,
  });
  return data;
}
