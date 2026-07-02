import type { KyInstance } from "ky";

import type { MusicVideo } from "@domain/model/music-video";
import { httpsUrl } from "@shared/url";
import { warnReadFailure } from "@shared/debug";

import { mapNcmMusicVideo } from "./mapper";
import type {
  NcmArtistMusicVideosResponse,
  NcmMusicVideoCountsResponse,
  NcmMusicVideoDetailResponse,
  NcmMusicVideoUrlResponse,
} from "./types";

export async function fetchNcmMusicVideoDetail(
  http: KyInstance,
  id: string,
): Promise<MusicVideo | undefined> {
  const [detail, url, counts] = await Promise.all([
    http.get("mv/detail", { searchParams: { mvid: id } }).json<NcmMusicVideoDetailResponse>(),
    http
      .get("mv/url", { searchParams: { id, r: 1080 } })
      .json<NcmMusicVideoUrlResponse>()
      .catch((error: unknown): NcmMusicVideoUrlResponse => {
        warnReadFailure(`NeteaseCloudMusic.mv/url(${id})`, error);
        return {};
      }),
    http
      .get("mv/detail/info", { searchParams: { mvid: id, timestamp: Date.now() } })
      .json<NcmMusicVideoCountsResponse>()
      .catch((error: unknown): NcmMusicVideoCountsResponse => {
        warnReadFailure(`NeteaseCloudMusic.mv/detail/info(${id})`, error);
        return {};
      }),
  ]);

  if (!detail.data) return undefined;
  return mapNcmMusicVideo(detail.data, {
    playUrl: url.data?.url ? httpsUrl(url.data.url) : undefined,
    playbackResolved: true,
    quality: url.data?.r,
    counts,
  });
}

export async function fetchNcmArtistMusicVideos(
  http: KyInstance,
  artistId: string,
): Promise<Partial<MusicVideo>[]> {
  const res = await http
    .get("artist/mv", { searchParams: { id: artistId, limit: 50, offset: 0 } })
    .json<NcmArtistMusicVideosResponse>();
  return (res.mvs ?? []).map((raw) => mapNcmMusicVideo(raw));
}
