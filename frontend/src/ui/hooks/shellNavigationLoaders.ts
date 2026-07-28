import type { QueryClient } from "@tanstack/react-query";

import type { MediaService } from "@contexts/catalog";

import type { ArtistTarget, DetailTarget, VibeMusicVideo } from "@/model/vibe";
import {
  detailKindOf,
  loadArtistTarget,
  loadMusicVideoDetail,
  mergeDetailTarget,
  mergeMusicVideoDetail,
  shouldFetchArtistTarget,
  shouldFetchDetailTarget,
  shouldFetchMusicVideoDetail,
} from "@/model/detail";
import { queryKeys } from "@/model/queryKeys";
import { queryDataOrNull } from "@/model/application-query";
import { toVibeAlbum, toVibePlaylist } from "@/model/adapters/collection";

type NavigationLoaderDeps = {
  media: MediaService;
  queryClient: QueryClient;
};

export function fetchDetailTarget(
  { media, queryClient }: NavigationLoaderDeps,
  summary: DetailTarget,
): Promise<DetailTarget | null> {
  if (!shouldFetchDetailTarget(summary)) return Promise.resolve(null);
  const kind = detailKindOf(summary);
  return queryClient
    .fetchQuery({
      queryKey: queryKeys.detail(media.providerId, kind, summary.id),
      queryFn: async () => {
        if (kind === "album") {
          const detail = queryDataOrNull(await media.albumDetail(summary.id));
          return detail ? toVibeAlbum(detail) : null;
        }
        if (kind === "chart") {
          const detail = queryDataOrNull(await media.toplistDetail(summary.id));
          return detail ? toVibePlaylist(detail) : null;
        }
        const detail = queryDataOrNull(await media.playlistDetail(summary.id));
        return detail ? toVibePlaylist(detail) : null;
      },
    })
    .then((full) => (full ? mergeDetailTarget(summary, full) : null));
}

export function fetchArtistTarget(
  { media, queryClient }: NavigationLoaderDeps,
  summary: ArtistTarget,
): Promise<ArtistTarget | null> {
  if (!shouldFetchArtistTarget(summary)) return Promise.resolve(null);
  return queryClient
    .fetchQuery({
      queryKey: queryKeys.artist(media.providerId, summary.id),
      queryFn: async () => {
        const detail = queryDataOrNull(await media.artistDetail(summary.id));
        return detail ? loadArtistTarget({ artistDetail: async () => detail }, summary) : null;
      },
    })
    .then((full) => full);
}

export function fetchMusicVideoTarget(
  { media, queryClient }: NavigationLoaderDeps,
  summary: VibeMusicVideo,
): Promise<VibeMusicVideo | undefined | null> {
  if (!shouldFetchMusicVideoDetail(summary, media.availability.musicVideoDetail)) {
    return Promise.resolve(null);
  }
  return queryClient.fetchQuery({
    queryKey: queryKeys.musicVideo(media.providerId, summary.id),
    queryFn: async () => {
      const detail = queryDataOrNull(await media.musicVideoDetail(summary.id));
      return detail
        ? loadMusicVideoDetail({ musicVideoDetail: async () => detail }, summary)
        : undefined;
    },
  });
}

export function mergeFetchedMusicVideo(
  current: VibeMusicVideo | null,
  requestedId: string,
  detail: VibeMusicVideo | undefined | null,
): VibeMusicVideo | null {
  return mergeMusicVideoDetail(current, requestedId, detail ?? undefined);
}
