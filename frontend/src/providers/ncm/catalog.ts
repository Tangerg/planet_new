import type { KyInstance } from "ky";

import type { Album } from "@domain/model/album";
import type { Artist } from "@domain/model/artist";
import type { Personalized } from "@domain/model/personalized";
import type { Playlist } from "@domain/model/playlist";
import type { Track } from "@domain/model/track";
import type { Chart } from "@domain/model/chart";

import {
  mapNcmAlbumNewest,
  mapNcmChart,
  mapNcmFeaturedArtist,
  mapNcmPlaylistStub,
  mapNcmTrack,
} from "../mappers/ncm";
import type {
  NcmNewestAlbumsResponse,
  NcmPersonalizedPlaylistsResponse,
  NcmPersonalizedTracksResponse,
  NcmTopArtistsResponse,
  NcmToplistsResponse,
} from "./types";

async function personalizedPlaylist(http: KyInstance): Promise<Partial<Playlist>[]> {
  const res = await http.get("personalized").json<NcmPersonalizedPlaylistsResponse>();
  return (res.result ?? []).map(mapNcmPlaylistStub);
}

async function personalizedTracks(http: KyInstance): Promise<Partial<Track>[]> {
  const res = await http.get("personalized/newsong").json<NcmPersonalizedTracksResponse>();
  return (res.result ?? []).flatMap((item) => (item.song ? [mapNcmTrack(item.song)] : []));
}

async function personalizedAlbums(http: KyInstance): Promise<Partial<Album>[]> {
  const res = await http.get("album/newest").json<NcmNewestAlbumsResponse>();
  return (res.albums ?? []).map(mapNcmAlbumNewest);
}

async function personalizedArtists(http: KyInstance): Promise<Partial<Artist>[]> {
  const res = await http.get("top/artists").json<NcmTopArtistsResponse>();
  return (res.artists ?? []).map(mapNcmFeaturedArtist);
}

export async function fetchNcmPersonalized(http: KyInstance): Promise<Personalized> {
  const [playlists, albums, artists, tracks] = await Promise.all([
    personalizedPlaylist(http),
    personalizedAlbums(http),
    personalizedArtists(http),
    personalizedTracks(http),
  ]);
  return {
    playlists: playlists.slice(0, 10),
    albums: albums.slice(0, 10),
    artists: artists.slice(0, 10),
    tracks: tracks.slice(0, 10),
  };
}

export async function fetchNcmToplists(http: KyInstance): Promise<Chart[]> {
  const res = await http
    .get("toplist")
    .json<NcmToplistsResponse>()
    .catch((): NcmToplistsResponse => ({ list: [] }));
  return (res.list ?? []).map(mapNcmChart).filter((chart) => chart.id && chart.title);
}
