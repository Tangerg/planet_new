import type { KyInstance } from "ky";

import { SearchResult } from "@domain/model/search";

import { mapNcmAlbumNewest, mapNcmFeaturedArtist, mapNcmPlaylistStub, mapNcmTrack } from "./mapper";
import type { NcmSearchResponse } from "./types";
import { requireSomeSettled, settledOr } from "../settled";

export async function searchNcm(http: KyInstance, query: string): Promise<SearchResult> {
  const q = query.trim();
  if (!q) return SearchResult.empty();

  const byType = (type: number) =>
    http
      .get("cloudsearch", { searchParams: { keywords: q, type, limit: 30 } })
      .json<NcmSearchResponse>();

  const [songsResult, artistsResult, albumsResult, playlistsResult] = await Promise.allSettled([
    byType(1),
    byType(100),
    byType(10),
    byType(1000),
  ]);
  requireSomeSettled("NCM search sections", [
    songsResult,
    artistsResult,
    albumsResult,
    playlistsResult,
  ]);
  const empty: NcmSearchResponse = { result: {} };
  const songs = settledOr(songsResult, empty);
  const artists = settledOr(artistsResult, empty);
  const albums = settledOr(albumsResult, empty);
  const playlists = settledOr(playlistsResult, empty);

  return {
    tracks: (songs.result?.songs ?? []).map((song, i) => mapNcmTrack(song, { index: i + 1 })),
    artists: (artists.result?.artists ?? []).map(mapNcmFeaturedArtist),
    albums: (albums.result?.albums ?? []).map(mapNcmAlbumNewest),
    playlists: (playlists.result?.playlists ?? []).map(mapNcmPlaylistStub),
  };
}
