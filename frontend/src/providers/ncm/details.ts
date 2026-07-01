import type { KyInstance } from "ky";

import type { Album } from "@domain/model/album";
import type { Artist } from "@domain/model/artist";
import type { Playlist } from "@domain/model/playlist";

import {
  coverSet,
  mapNcmAlbum,
  mapNcmAlbumNewest,
  mapNcmFeaturedArtist,
  mapNcmPlaylist,
  mapNcmTrack,
} from "../mappers/ncm";
import type {
  NcmAlbumDetailResponse,
  NcmArtistAlbumsResponse,
  NcmArtistDescriptionResponse,
  NcmArtistInfoResponse,
  NcmPlaylist,
  NcmPlaylistDetailResponse,
  NcmSimilarArtistsResponse,
} from "./types";
import { fetchNcmPlaylistTracks } from "./tracks";

export async function fetchNcmPlaylistDetail(http: KyInstance, id: string): Promise<Playlist> {
  const res = await http
    .get("playlist/detail", {
      searchParams: { id },
    })
    .json<NcmPlaylistDetailResponse>();
  const playlist: NcmPlaylist = res.playlist ?? {};
  const songs = await fetchNcmPlaylistTracks(http, id, playlist.trackCount).catch(() => []);
  return mapNcmPlaylist({
    ...playlist,
    tracks: songs.length ? songs : (playlist.tracks ?? []),
  });
}

export async function fetchNcmAlbumDetail(http: KyInstance, id: string): Promise<Album> {
  const res = await http
    .get("album", {
      searchParams: { id },
    })
    .json<NcmAlbumDetailResponse>();
  return mapNcmAlbum(res.album ?? {}, res.songs ?? []);
}

export async function fetchNcmArtistDetail(http: KyInstance, id: string): Promise<Artist> {
  const [info, desc, albumRes, simiRes] = await Promise.all([
    http
      .get("artists", { searchParams: { id } })
      .json<NcmArtistInfoResponse>()
      .catch((): NcmArtistInfoResponse => ({ artist: {}, hotSongs: [] })),
    http
      .get("artist/desc", { searchParams: { id } })
      .json<NcmArtistDescriptionResponse>()
      .catch((): NcmArtistDescriptionResponse => ({})),
    http
      .get("artist/album", { searchParams: { id, limit: 50 } })
      .json<NcmArtistAlbumsResponse>()
      .catch((): NcmArtistAlbumsResponse => ({ hotAlbums: [] })),
    http
      .get("simi/artist", { searchParams: { id } })
      .json<NcmSimilarArtistsResponse>()
      .catch((): NcmSimilarArtistsResponse => ({ artists: [] })),
  ]);

  const artist = info.artist ?? {};
  const topTracks = (info.hotSongs ?? []).map((track, index) =>
    mapNcmTrack(track, { index: index + 1 }),
  );
  const albums = (albumRes.hotAlbums ?? []).map(mapNcmAlbumNewest);
  const similar = (simiRes.artists ?? []).map(mapNcmFeaturedArtist);
  const description = desc.briefDesc || desc.introduction?.[0]?.txt || "";
  return {
    id: artist.id?.toString() ?? id,
    name: artist.name ?? "",
    images: coverSet(artist.img1v1Url ?? artist.picUrl),
    alias: artist.alias ?? [],
    description,
    topTracks,
    albums,
    similar,
  };
}
