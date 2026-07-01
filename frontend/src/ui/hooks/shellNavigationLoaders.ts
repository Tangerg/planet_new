import type { QueryClient } from "@tanstack/react-query";

import type { MediaService } from "@core";

import type { ArtistTarget, DetailTarget, VibeMusicVideo } from "@/model/adapt";
import {
  detailKindOf,
  loadArtistTarget,
  loadDetailTarget,
  loadMusicVideoDetail,
  mergeDetailTarget,
  mergeMusicVideoDetail,
  shouldFetchArtistTarget,
  shouldFetchDetailTarget,
  shouldFetchMusicVideoDetail,
} from "@/model/detail";
import { queryKeys } from "@/model/queryKeys";

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
      queryKey: queryKeys.detail(media.providerName, kind, summary.id),
      queryFn: () => loadDetailTarget(media, summary),
    })
    .then((full) => mergeDetailTarget(summary, full));
}

export function fetchArtistTarget(
  { media, queryClient }: NavigationLoaderDeps,
  summary: ArtistTarget,
): Promise<ArtistTarget | null> {
  if (!shouldFetchArtistTarget(summary)) return Promise.resolve(null);
  return queryClient
    .fetchQuery({
      queryKey: queryKeys.artist(media.providerName, summary.id),
      queryFn: () => loadArtistTarget(media, summary),
    })
    .then((full) => full);
}

export function fetchMusicVideoTarget(
  { media, queryClient }: NavigationLoaderDeps,
  summary: VibeMusicVideo,
): Promise<VibeMusicVideo | undefined | null> {
  if (!shouldFetchMusicVideoDetail(summary, (cap) => media.supports(cap))) {
    return Promise.resolve(null);
  }
  return queryClient.fetchQuery({
    queryKey: queryKeys.musicVideo(media.providerName, summary.id),
    queryFn: () => loadMusicVideoDetail(media, summary),
  });
}

export function mergeFetchedMusicVideo(
  current: VibeMusicVideo | null,
  requestedId: string,
  detail: VibeMusicVideo | undefined | null,
): VibeMusicVideo | null {
  return mergeMusicVideoDetail(current, requestedId, detail ?? undefined);
}
