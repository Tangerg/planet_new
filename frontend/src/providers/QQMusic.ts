import ky, { KyInstance } from "ky";

import { Provider } from "./provider";
import { ProviderCapability } from "@domain";
import { Album } from "@domain/model/album";
import { Artist } from "@domain/model/artist";
import { Lyric, parseLyrics } from "@domain/model/lyric";
import { Personalized } from "@domain/model/personalized";
import { Playlist } from "@domain/model/playlist";
import { TrackPlayUrl } from "@domain/model/track";
import { SearchResult } from "@domain/model/search";
import { Chart } from "@domain/model/chart";
import {
  mapQQAlbumDetail,
  mapQQArtistFromList,
  mapQQChart,
  mapQQNewAlbum,
  mapQQPlaylistDetail,
  mapQQPlaylistStub,
  mapQQRankSong,
  mapQQSmartboxAlbum,
  mapQQSmartboxSinger,
  mapQQSmartboxSong,
  mapQQTrackFromSong,
  singerImage,
} from "./mappers/qqmusic";
import type {
  QQAlbumInfoResponse,
  QQMusicPlayResponse,
  QQNewDisksResponse,
  QQRanksResponse,
  QQSingerDescriptionResponse,
  QQSingerHotsongResponse,
  QQSingerListResponse,
  QQSmartboxResponse,
  QQSongListDetailResponse,
  QQSongListsResponse,
  QQTopListsResponse,
  QQLyricResponse,
  QQTrack,
} from "./qqmusic/types";

export type QQMusicOptions = {
  /** Like `http://localhost:3200`; targets the Rain120/qq-music-api server. */
  host: string;
};

export class QQMusic extends Provider {
  public static readonly NAME = "QQMusic";
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

  constructor(opts: QQMusicOptions) {
    super();
    this.http = ky.create({ prefix: opts.host, timeout: 10_000 });
  }

  get name(): string {
    return QQMusic.NAME;
  }

  get capabilities(): ReadonlySet<ProviderCapability> {
    return QQMusic.CAPABILITIES;
  }

  async playlistDetail(id: string): Promise<Playlist> {
    const res = await this.http
      .get("getSongListDetail", { searchParams: { disstid: id } })
      .json<QQSongListDetailResponse>();
    const cd = res.response?.cdlist?.[0] ?? {};
    return mapQQPlaylistDetail(cd);
  }

  async albumDetail(id: string): Promise<Album> {
    const res = await this.http
      .get("getAlbumInfo", { searchParams: { albummid: id } })
      .json<QQAlbumInfoResponse>();
    const data = res.response?.data ?? {};
    return mapQQAlbumDetail(data);
  }

  async artistDetail(id: string): Promise<Artist> {
    // Parallel: top tracks + bio.
    const [hotsong, desc] = await Promise.all([
      this.http
        .get("getSingerHotsong", {
          searchParams: { singermid: id, limit: 10, page: 1 },
        })
        .json<QQSingerHotsongResponse>()
        .catch((): QQSingerHotsongResponse => ({})),
      this.http
        .get("getSingerDesc", { searchParams: { singermid: id } })
        .json<QQSingerDescriptionResponse>()
        .catch((): QQSingerDescriptionResponse => ({})),
    ]);

    const songs =
      hotsong.response?.songList
        ?.map((s) => s.musicData)
        .filter((song): song is QQTrack => Boolean(song)) ?? [];
    const topTracks = songs.map((s, i) => mapQQTrackFromSong(s, i + 1));

    const singerInfo = hotsong.response?.singerInfo ?? {};
    const basicInfo = desc.response?.data?.basic_info ?? {};
    const description = desc.response?.data?.info?.desc ?? "";

    const artistImage = singerImage(id, 500);
    return {
      id,
      name: singerInfo.singer_name ?? basicInfo.name ?? "",
      images: artistImage ? [{ url: artistImage }] : [],
      banner: singerImage(id, 800),
      description,
      topTracks,
    };
  }

  async lyric(id: string): Promise<Lyric[]> {
    const res = await this.http
      .get("getLyric", { searchParams: { songmid: id } })
      .json<QQLyricResponse>();
    const lrc = res.response?.lyric ?? "";
    if (!lrc) return [];
    return parseLyrics(lrc);
  }

  async playUrls(ids: string[]): Promise<TrackPlayUrl[]> {
    if (ids.length === 0) return [];
    // /getMusicPlay accepts comma-separated batches.
    const res = await this.http
      .get("getMusicPlay", { searchParams: { songmid: ids.join(",") } })
      .json<QQMusicPlayResponse>();
    const playUrl = res.data?.playUrl ?? {};
    const out: TrackPlayUrl[] = [];
    for (const [songmid, info] of Object.entries(playUrl)) {
      if (info?.url) {
        out.push({ id: songmid, playUrl: info.url });
      }
    }
    return out;
  }

  async personalized(): Promise<Personalized> {
    // Fetch 3 sections in parallel; tracks are left empty (the QQ chart endpoint returns no songmid, so they cannot join the playback flow and are not rendered yet).
    const [popularPlaylists, newAlbums, hotSingers] = await Promise.all([
      this.http
        .get("getSongLists", { searchParams: { page: 0, limit: 20 } })
        .json<QQSongListsResponse>()
        .catch(() => ({ response: { data: { list: [] } } })),
      this.http
        .get("getNewDisks", { searchParams: { page: 2, limit: 10 } })
        .json<QQNewDisksResponse>()
        .catch(() => ({ response: { new_album: { data: { albums: [] } } } })),
      this.http
        .get("getSingerList", {
          searchParams: { index: -100, page: 1 },
        })
        .json<QQSingerListResponse>()
        .catch(() => ({
          response: { singerList: { data: { singerlist: [] } } },
        })),
    ]);

    const playlists: Partial<Playlist>[] = (popularPlaylists.response?.data?.list ?? [])
      .slice(0, 10)
      .map(mapQQPlaylistStub);

    const albums: Partial<Album>[] = (newAlbums.response?.new_album?.data?.albums ?? [])
      .slice(0, 10)
      .map(mapQQNewAlbum);

    const artists: Partial<Artist>[] = (hotSingers.response?.singerList?.data?.singerlist ?? [])
      .slice(0, 10)
      .map(mapQQArtistFromList);

    return {
      playlists,
      albums,
      artists,
      tracks: [],
    };
  }

  async search(query: string): Promise<SearchResult> {
    const q = query.trim();
    if (!q) return SearchResult.empty();
    // The old client_search_cp was retired upstream (500); use smartbox suggest, which returns songs/singers/albums in one call.
    const res = await this.http
      .get("getSmartbox", { searchParams: { key: q } })
      .json<QQSmartboxResponse>()
      .catch((): QQSmartboxResponse => ({}));
    const d = res.response?.data ?? {};
    return {
      tracks: (d.song?.itemlist ?? []).map(mapQQSmartboxSong),
      artists: (d.singer?.itemlist ?? []).map(mapQQSmartboxSinger),
      albums: (d.album?.itemlist ?? []).map(mapQQSmartboxAlbum),
      playlists: [],
    };
  }

  async toplists(): Promise<Chart[]> {
    const res = await this.http
      .get("getTopLists")
      .json<QQTopListsResponse>()
      .catch((): QQTopListsResponse => ({}));
    return (res.response?.data?.topList ?? []).map(mapQQChart).filter((c) => c.id && c.title);
  }

  async toplistDetail(id: string): Promise<Playlist> {
    const res = await this.http
      .get("getRanks", { searchParams: { topId: id, limit: 100, page: 0 } })
      .json<QQRanksResponse>()
      .catch((): QQRanksResponse => ({}));
    const list = res.response?.req_1?.data?.data?.song ?? [];
    const tracks = list.map((s, i) => mapQQRankSong(s, i + 1));
    return {
      id,
      name: "",
      description: "",
      images: [],
      tracks,
      owner: { displayName: "Sonance" },
      totalTracks: tracks.length,
    };
  }
}
