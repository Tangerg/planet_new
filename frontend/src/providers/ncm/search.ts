import type { KyInstance } from "ky";

import { SearchResult } from "@domain/model/search";

import {
  mapNcmAlbumNewest,
  mapNcmFeaturedArtist,
  mapNcmPlaylistStub,
  mapNcmTrack,
} from "../mappers/ncm";
import type { NcmSearchResponse } from "./types";

export async function searchNcm(http: KyInstance, query: string): Promise<SearchResult> {
  const q = query.trim();
  if (!q) return SearchResult.empty();

  const byType = (type: number) =>
    http
      .get("cloudsearch", { searchParams: { keywords: q, type, limit: 30 } })
      .json<NcmSearchResponse>()
      .catch((): NcmSearchResponse => ({ result: {} }));

  const [songs, artists, albums, playlists] = await Promise.all([
    byType(1),
    byType(100),
    byType(10),
    byType(1000),
  ]);

  return {
    tracks: (songs.result?.songs ?? []).map((song, i) => mapNcmTrack(song, { index: i + 1 })),
    artists: (artists.result?.artists ?? []).map(mapNcmFeaturedArtist),
    albums: (albums.result?.albums ?? []).map(mapNcmAlbumNewest),
    playlists: (playlists.result?.playlists ?? []).map(mapNcmPlaylistStub),
  };
}
