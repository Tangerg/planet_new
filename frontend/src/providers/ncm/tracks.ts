import type { KyInstance } from "ky";

import { mergeTranslations, parseLyrics, type Lyric } from "@domain/model/lyric";
import type { TrackPlayUrl, TrackSnapshot } from "@domain/model/track";

import { httpsUrl } from "@shared/url";

import { mapNcmTrack } from "./mapper";
import type {
  NcmLyricResponse,
  NcmPlayUrlResponse,
  NcmPlaylistTracksResponse,
  NcmSongDetailResponse,
  NcmTrack,
} from "./types";

const PLAYLIST_TRACK_PAGE_SIZE = 500;
const TRACK_DETAIL_BATCH_SIZE = 100;

export async function fetchNcmPlaylistTracks(
  http: KyInstance,
  id: string,
  total?: number,
): Promise<NcmTrack[]> {
  const tracks: NcmTrack[] = [];
  for (let offset = 0; ; offset += PLAYLIST_TRACK_PAGE_SIZE) {
    const res = await http
      .get("playlist/track/all", {
        searchParams: { id, limit: PLAYLIST_TRACK_PAGE_SIZE, offset },
      })
      .json<NcmPlaylistTracksResponse>();
    const songs = res.songs ?? [];
    tracks.push(...songs);
    if (songs.length < PLAYLIST_TRACK_PAGE_SIZE) break;
    if (total && tracks.length >= total) break;
  }
  return tracks;
}

export async function fetchNcmLyrics(http: KyInstance, id: string): Promise<Lyric[]> {
  const res = await http.get("lyric", { searchParams: { id } }).json<NcmLyricResponse>();
  const main = parseLyrics(res.lrc?.lyric ?? "");
  const translated = parseLyrics(res.tlyric?.lyric ?? "");
  return mergeTranslations(main, translated);
}

export async function fetchNcmTrackDetails(
  http: KyInstance,
  ids: readonly string[],
): Promise<TrackSnapshot[]> {
  const uniqueIds = [...new Set(ids.map(String).filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const byId = new Map<string, TrackSnapshot>();
  const failures: unknown[] = [];
  let successfulBatches = 0;
  for (let i = 0; i < uniqueIds.length; i += TRACK_DETAIL_BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + TRACK_DETAIL_BATCH_SIZE);
    let res: NcmSongDetailResponse;
    try {
      res = await http
        .get("song/detail", { searchParams: { ids: batch.join(",") } })
        .json<NcmSongDetailResponse>();
      successfulBatches += 1;
    } catch (error) {
      failures.push(error);
      continue;
    }
    for (const raw of res.songs ?? []) {
      const track = mapNcmTrack(raw);
      if (track.id) byId.set(track.id, track);
    }
  }
  if (successfulBatches === 0) {
    throw new AggregateError(failures, "NCM track detail batches failed");
  }

  return ids.map((id) => byId.get(String(id))).filter((track): track is TrackSnapshot => !!track);
}

export async function fetchNcmPlayUrls(
  http: KyInstance,
  playbackIds: readonly string[],
): Promise<TrackPlayUrl[]> {
  if (playbackIds.length === 0) return [];
  const res = await http
    .get("song/url/v1", {
      searchParams: {
        level: "exhigh",
        id: playbackIds.join(","),
      },
    })
    .json<NcmPlayUrlResponse>();
  return (res.data ?? [])
    .filter((track): track is { id: string | number; url: string } => !!track.url)
    .map(
      (track): TrackPlayUrl => ({
        playbackId: track.id.toString(),
        playUrl: httpsUrl(track.url),
      }),
    );
}
