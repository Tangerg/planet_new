import type { KyInstance } from "ky";

import { mergeTranslations, parseLyrics, type Lyric } from "@domain/model/lyric";
import type { TrackPlayUrl, TrackSnapshot } from "@domain/model/track";

import { mapConcurrent, pageOffsets } from "@shared/async";
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
/** In-flight request ceiling for a page/batch fan-out against one API host. */
const REQUEST_CONCURRENCY = 6;

function playlistTrackPage(
  http: KyInstance,
  id: string,
  offset: number,
): Promise<NcmPlaylistTracksResponse> {
  return http
    .get("playlist/track/all", {
      searchParams: { id, limit: PLAYLIST_TRACK_PAGE_SIZE, offset },
    })
    .json<NcmPlaylistTracksResponse>();
}

/**
 * A playlist's full tracklist. Pages are independent, so when the caller knows
 * the track count they all go out together — this is the detail screen's fill,
 * and a 2000-track playlist used to cost four SEQUENTIAL round trips before the
 * first track appeared.
 *
 * Without a count there is no way to know how many pages exist, so it falls back
 * to probing one page at a time until a short page ends the list.
 */
export async function fetchNcmPlaylistTracks(
  http: KyInstance,
  id: string,
  total?: number,
): Promise<NcmTrack[]> {
  if (total && total > 0) {
    const pages = await mapConcurrent(
      pageOffsets(total, PLAYLIST_TRACK_PAGE_SIZE),
      REQUEST_CONCURRENCY,
      (offset) => playlistTrackPage(http, id, offset),
    );
    return pages.flatMap((page) => page.songs ?? []);
  }

  const tracks: NcmTrack[] = [];
  for (let offset = 0; ; offset += PLAYLIST_TRACK_PAGE_SIZE) {
    const songs = (await playlistTrackPage(http, id, offset)).songs ?? [];
    tracks.push(...songs);
    if (songs.length < PLAYLIST_TRACK_PAGE_SIZE) break;
  }
  return tracks;
}

export async function fetchNcmLyrics(http: KyInstance, id: string): Promise<Lyric[]> {
  const res = await http.get("lyric", { searchParams: { id } }).json<NcmLyricResponse>();
  const main = parseLyrics(res.lrc?.lyric ?? "");
  const translated = parseLyrics(res.tlyric?.lyric ?? "");
  return mergeTranslations(main, translated);
}

/**
 * Track metadata for a set of ids. Batches are independent, so they go out
 * together rather than one after another — resolving a several-hundred-track
 * queue was that many sequential round trips.
 *
 * Partial failure is tolerated on purpose (a missing batch loses those rows, not
 * the screen); only an all-batches-failed result throws. The batch task
 * therefore catches for itself instead of letting the fan-out reject.
 */
export async function fetchNcmTrackDetails(
  http: KyInstance,
  ids: readonly string[],
): Promise<TrackSnapshot[]> {
  const uniqueIds = [...new Set(ids.map(String).filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const batches: string[][] = [];
  for (let i = 0; i < uniqueIds.length; i += TRACK_DETAIL_BATCH_SIZE) {
    batches.push(uniqueIds.slice(i, i + TRACK_DETAIL_BATCH_SIZE));
  }

  const outcomes = await mapConcurrent(
    batches,
    REQUEST_CONCURRENCY,
    async (batch): Promise<{ songs: NcmSongDetailResponse["songs"] } | { error: unknown }> => {
      try {
        const res = await http
          .get("song/detail", { searchParams: { ids: batch.join(",") } })
          .json<NcmSongDetailResponse>();
        return { songs: res.songs };
      } catch (error) {
        return { error };
      }
    },
  );

  const byId = new Map<string, TrackSnapshot>();
  const failures: unknown[] = [];
  for (const outcome of outcomes) {
    if ("error" in outcome) {
      failures.push(outcome.error);
      continue;
    }
    for (const raw of outcome.songs ?? []) {
      const track = mapNcmTrack(raw);
      if (track.id) byId.set(track.id, track);
    }
  }
  if (failures.length === batches.length) {
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
