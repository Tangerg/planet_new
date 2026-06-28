import ky, { KyInstance } from "ky";

import { Provider } from "./provider";
import { ProviderCapability } from "@domain";
import { Playlist } from "@domain/model/playlist";
import { Track, TrackPlayUrl } from "@domain/model/track";
import { Artist } from "@domain/model/artist";
import { Lyric, parseLyrics } from "@domain/model/lyric";
import { Album } from "@domain/model/album";
import { Chart } from "@domain/model/chart";
import { Personalized } from "@domain/model/personalized";
import { SearchResult } from "@domain/model/search";
import {
  mapNcmAlbum,
  mapNcmAlbumNewest,
  mapNcmChart,
  mapNcmFeaturedArtist,
  mapNcmPlaylist,
  mapNcmPlaylistStub,
  mapNcmTrack,
  coverSet,
  toHttps,
} from "./mappers/ncm";

export type Options = {
  host: string;
};

export class NeteaseCloudMusic extends Provider {
  public static readonly NAME = "NeteaseCloudMusic";
  private static readonly CAPABILITIES: ReadonlySet<ProviderCapability> =
    new Set<ProviderCapability>([
      "playlistDetail",
      "albumDetail",
      "artistDetail",
      "lyric",
      "personalized",
      "search",
      "toplist",
      "fullPlayback",
    ]);

  private readonly http: KyInstance;

  constructor(opts: Options) {
    super();
    this.http = ky.create({
      prefix: opts.host,
      timeout: 10_000,
    });
  }

  get name(): string {
    return NeteaseCloudMusic.NAME;
  }

  get capabilities(): ReadonlySet<ProviderCapability> {
    return NeteaseCloudMusic.CAPABILITIES;
  }

  async playlistDetail(id: string): Promise<Playlist> {
    const res = await this.http
      .get("playlist/detail", {
        searchParams: { id },
      })
      .json<{ playlist: any }>();
    return mapNcmPlaylist(res.playlist);
  }

  async lyric(id: string): Promise<Lyric[]> {
    const res = await this.http
      .get("lyric", {
        searchParams: { id },
      })
      .json<{ lrc: { version: number; lyric: string } }>();
    return parseLyrics(res.lrc.lyric);
  }

  async albumDetail(id: string): Promise<Album> {
    const res = await this.http
      .get("album", {
        searchParams: { id },
      })
      .json<{ album: any; songs: any[] }>();
    return mapNcmAlbum(res.album, res.songs ?? []);
  }

  async artistDetail(id: string): Promise<Artist> {
    type ArtistInfoRes = { artist: any; hotSongs: any[] };
    type ArtistDescRes = {
      briefDesc?: string;
      introduction?: { ti?: string; txt?: string }[];
    };
    type ArtistAlbumRes = { hotAlbums?: any[] };
    // /artists returns artist info + hotSongs in one call; bio comes from
    // /artist/desc; the discography from /artist/album. All three in parallel.
    const [info, desc, albumRes] = await Promise.all([
      this.http
        .get("artists", { searchParams: { id } })
        .json<ArtistInfoRes>()
        .catch(() => ({ artist: {}, hotSongs: [] }) as ArtistInfoRes),
      this.http
        .get("artist/desc", { searchParams: { id } })
        .json<ArtistDescRes>()
        .catch(() => ({}) as ArtistDescRes),
      this.http
        .get("artist/album", { searchParams: { id, limit: 50 } })
        .json<ArtistAlbumRes>()
        .catch(() => ({ hotAlbums: [] }) as ArtistAlbumRes),
    ]);

    const artist = info.artist ?? {};
    const topTracks = (info.hotSongs ?? [])
      .slice(0, 10)
      .map((s, i) => mapNcmTrack(s, { index: i + 1 }));
    const albums = (albumRes.hotAlbums ?? []).map(mapNcmAlbumNewest);
    const description = desc.briefDesc || desc.introduction?.[0]?.txt || "";
    return {
      id: artist.id?.toString() ?? id,
      name: artist.name ?? "",
      // Use the canonical square avatar (img1v1) — the SAME asset the artist
      // cards (featured / search) use — so opening an artist morphs the round
      // card straight into the round hero with no image swap. NCM's `cover` is
      // just the portrait (not a wide banner), so there's no banner to set.
      images: coverSet(artist.img1v1Url ?? artist.picUrl),
      alias: artist.alias ?? [],
      description,
      topTracks,
      albums,
    };
  }

  async playUrls(ids: string[]): Promise<TrackPlayUrl[]> {
    if (ids.length === 0) return [];
    const res = await this.http
      .get("song/url/v1", {
        searchParams: {
          level: "exhigh",
          id: ids.join(","),
        },
      })
      .json<{ data: Array<{ id: number | string; url: string | null }> }>();
    return res.data
      .filter((tr) => !!tr.url)
      .map(
        (tr): TrackPlayUrl => ({
          id: tr.id.toString(),
          // NCM returns http stream URLs; the secure-context webview blocks
          // http <audio src> as mixed content, so upgrade to https (the CDN
          // serves both — verified 206 audio/mpeg).
          playUrl: toHttps(tr.url as string),
        }),
      );
  }

  private async personalizedPlaylist(): Promise<Partial<Playlist>[]> {
    const res = await this.http.get("personalized").json<{ result: any[] }>();
    return res.result.map(mapNcmPlaylistStub);
  }

  private async personalizedTracks(): Promise<Partial<Track>[]> {
    const res = await this.http
      .get("personalized/newsong")
      .json<{ result: Array<{ song: any }> }>();
    return res.result.map((item) => mapNcmTrack(item.song));
  }

  private async personalizedAlbums(): Promise<Partial<Album>[]> {
    const res = await this.http.get("album/newest").json<{ albums: any[] }>();
    return res.albums.map(mapNcmAlbumNewest);
  }

  private async personalizedArtists(): Promise<Partial<Artist>[]> {
    const res = await this.http.get("top/artists").json<{ artists: any[] }>();
    return res.artists.map(mapNcmFeaturedArtist);
  }

  async personalized(): Promise<Personalized> {
    const [playlists, albums, artists, tracks] = await Promise.all([
      this.personalizedPlaylist(),
      this.personalizedAlbums(),
      this.personalizedArtists(),
      this.personalizedTracks(),
    ]);
    return {
      playlists: playlists.slice(0, 10),
      albums: albums.slice(0, 10),
      artists: artists.slice(0, 10),
      tracks: tracks.slice(0, 10),
    };
  }

  async search(query: string): Promise<SearchResult> {
    const q = query.trim();
    if (!q) return SearchResult.empty();
    // /cloudsearch returns full song nodes (al/ar/dt); one call per type, in
    // parallel. type 1=songs · 100=artists · 10=albums · 1000=playlists.
    const byType = (type: number) =>
      this.http
        .get("cloudsearch", { searchParams: { keywords: q, type, limit: 30 } })
        .json<{ result?: any }>()
        .catch(() => ({ result: {} }) as { result?: any });
    const [songs, artists, albums, playlists] = await Promise.all([
      byType(1),
      byType(100),
      byType(10),
      byType(1000),
    ]);
    return {
      tracks: (songs.result?.songs ?? []).map((s: any, i: number) =>
        mapNcmTrack(s, { index: i + 1 }),
      ),
      artists: (artists.result?.artists ?? []).map(mapNcmFeaturedArtist),
      albums: (albums.result?.albums ?? []).map(mapNcmAlbumNewest),
      playlists: (playlists.result?.playlists ?? []).map(mapNcmPlaylistStub),
    };
  }

  async toplists(): Promise<Chart[]> {
    const res = await this.http
      .get("toplist")
      .json<{ list?: any[] }>()
      .catch(() => ({ list: [] }) as { list?: any[] });
    return (res.list ?? []).map(mapNcmChart).filter((c) => c.id && c.title);
  }

  async toplistDetail(id: string): Promise<Playlist> {
    // A chart is a playlist on NCM, so its detail goes through the same endpoint.
    return this.playlistDetail(id);
  }
}
