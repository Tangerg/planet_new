import type { KyInstance } from "ky";

import type { AlbumSnapshot } from "@domain/model/album";
import type { ArtistSnapshot } from "@domain/model/artist";
import type { Personalized } from "@domain/model/personalized";
import type { PlaylistSnapshot } from "@domain/model/playlist";
import type { TrackSnapshot } from "@domain/model/track";
import type { Chart } from "@domain/model/chart";

import {
  mapNcmAlbumNewest,
  mapNcmChart,
  mapNcmFeaturedArtist,
  mapNcmPlaylistStub,
  mapNcmTrack,
} from "./mapper";
import type {
  NcmNewestAlbumsResponse,
  NcmPersonalizedPlaylistsResponse,
  NcmPersonalizedTracksResponse,
  NcmTopArtistsResponse,
  NcmToplistsResponse,
} from "./types";
import { requireSomeSettled, settledOr } from "../settled";

async function personalizedPlaylist(http: KyInstance): Promise<PlaylistSnapshot[]> {
  const res = await http.get("personalized").json<NcmPersonalizedPlaylistsResponse>();
  return (res.result ?? []).map(mapNcmPlaylistStub);
}

async function personalizedTracks(http: KyInstance): Promise<TrackSnapshot[]> {
  const res = await http.get("personalized/newsong").json<NcmPersonalizedTracksResponse>();
  return (res.result ?? []).flatMap((item) => (item.song ? [mapNcmTrack(item.song)] : []));
}

async function personalizedAlbums(http: KyInstance): Promise<AlbumSnapshot[]> {
  const res = await http.get("album/newest").json<NcmNewestAlbumsResponse>();
  return (res.albums ?? []).map(mapNcmAlbumNewest);
}

async function personalizedArtists(http: KyInstance): Promise<ArtistSnapshot[]> {
  const res = await http.get("top/artists").json<NcmTopArtistsResponse>();
  return (res.artists ?? []).map(mapNcmFeaturedArtist);
}

export async function fetchNcmPersonalized(http: KyInstance): Promise<Personalized> {
  const [playlistsResult, albumsResult, artistsResult, tracksResult] = await Promise.allSettled([
    personalizedPlaylist(http),
    personalizedAlbums(http),
    personalizedArtists(http),
    personalizedTracks(http),
  ]);
  requireSomeSettled("NCM personalized sections", [
    playlistsResult,
    albumsResult,
    artistsResult,
    tracksResult,
  ]);
  const playlists = settledOr(playlistsResult, []);
  const albums = settledOr(albumsResult, []);
  const artists = settledOr(artistsResult, []);
  const tracks = settledOr(tracksResult, []);
  return {
    playlists: playlists.slice(0, 10),
    albums: albums.slice(0, 10),
    artists: artists.slice(0, 10),
    tracks: tracks.slice(0, 10),
  };
}

export async function fetchNcmToplists(http: KyInstance): Promise<Chart[]> {
  const res = await http.get("toplist").json<NcmToplistsResponse>();
  return (res.list ?? []).map(mapNcmChart).filter((chart) => chart.id && chart.title);
}
