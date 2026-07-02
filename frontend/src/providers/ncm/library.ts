import type { KyInstance } from "ky";

import type { Playlist } from "@domain/model/playlist";
import type { Track } from "@domain/model/track";

import { mapNcmPlaylistStub, mapNcmTrack } from "./mapper";
import type {
  NcmDailyRecommendationsResponse,
  NcmLikedTrackIdsResponse,
  NcmPlayRecordResponse,
  NcmUserPlaylistsResponse,
} from "./types";

export async function fetchNcmLikedTrackIds(http: KyInstance, uid: string): Promise<string[]> {
  const res = await http
    .get("likelist", { searchParams: { uid, timestamp: Date.now() } })
    .json<NcmLikedTrackIdsResponse>()
    .catch((): NcmLikedTrackIdsResponse => ({ ids: [] }));
  return (res.ids ?? []).map(String);
}

export async function setNcmLiked(
  http: KyInstance,
  trackId: string,
  liked: boolean,
): Promise<void> {
  await http.get("like", {
    searchParams: { id: trackId, like: liked, timestamp: Date.now() },
  });
}

export async function fetchNcmUserPlaylists(http: KyInstance, uid: string): Promise<Playlist[]> {
  const res = await http
    .get("user/playlist", { searchParams: { uid, limit: 50, timestamp: Date.now() } })
    .json<NcmUserPlaylistsResponse>()
    .catch((): NcmUserPlaylistsResponse => ({ playlist: [] }));
  return (res.playlist ?? []).map((playlist): Playlist => {
    const stub = mapNcmPlaylistStub(playlist);
    return {
      id: stub.id ?? "",
      name: stub.name ?? "",
      description: stub.description,
      images: stub.images ?? [],
      owner: stub.owner,
      totalTracks: stub.totalTracks,
      tracks: [],
    };
  });
}

export async function fetchNcmPlayRecord(
  http: KyInstance,
  uid: string,
  period: "week" | "all",
): Promise<Partial<Track>[]> {
  const type = period === "week" ? 1 : 0;
  const res = await http
    .get("user/record", { searchParams: { uid, type, timestamp: Date.now() } })
    .json<NcmPlayRecordResponse>()
    .catch((): NcmPlayRecordResponse => ({}));
  const rows = period === "week" ? res.weekData : res.allData;
  return (rows ?? []).flatMap((row, index) =>
    row.song ? [mapNcmTrack(row.song, { index: index + 1 })] : [],
  );
}

export async function fetchNcmDailyRecommendations(http: KyInstance): Promise<Partial<Track>[]> {
  const res = await http
    .get("recommend/songs", { searchParams: { timestamp: Date.now() } })
    .json<NcmDailyRecommendationsResponse>()
    .catch((): NcmDailyRecommendationsResponse => ({ data: {} }));
  return (res.data?.dailySongs ?? []).map((track, index) =>
    mapNcmTrack(track, { index: index + 1 }),
  );
}
