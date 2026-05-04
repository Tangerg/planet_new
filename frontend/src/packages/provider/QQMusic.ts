import ky, { KyInstance } from "ky";

import Provider from "./provider";
import { ProviderCapability } from "./types";
import { Album } from "../model/album";
import { Artist } from "../model/artist";
import { Lyric, parseLyrics } from "../model/lyric";
import { Personalized } from "../model/personalized";
import { Playlist } from "../model/playlist";
import { TrackPlayUrl } from "../model/track";
import {
  mapQQAlbumDetail,
  mapQQArtistFromList,
  mapQQNewAlbum,
  mapQQPlaylistDetail,
  mapQQPlaylistStub,
  mapQQTrackFromSong,
  singerImage,
} from "./mappers/qqmusic";

export type QQMusicOptions = {
  /** 形如 `http://localhost:3200`，对接 Rain120/qq-music-api 服务 */
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
      "fullPlayback",
    ]);

  private readonly http: KyInstance;

  constructor(opts: QQMusicOptions) {
    super();
    this.http = ky.create({ prefix: opts.host });
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
      .json<{ response?: { cdlist?: any[] } }>();
    const cd = res.response?.cdlist?.[0] ?? {};
    return mapQQPlaylistDetail(cd);
  }

  async albumDetail(id: string): Promise<Album> {
    const res = await this.http
      .get("getAlbumInfo", { searchParams: { albummid: id } })
      .json<{ response?: { data?: any } }>();
    const data = res.response?.data ?? {};
    return mapQQAlbumDetail(data);
  }

  async artistDetail(id: string): Promise<Artist> {
    type HotsongRes = {
      response?: {
        songList?: Array<{ musicData?: any }>;
        singerInfo?: { singer_name?: string };
      };
    };
    type DescRes = {
      response?: {
        data?: {
          info?: { desc?: string };
          basic_info?: { name?: string };
        };
      };
    };
    // 并行：热门曲目 + 简介
    const [hotsong, desc] = await Promise.all([
      this.http
        .get("getSingerHotsong", {
          searchParams: { singermid: id, limit: 10, page: 1 },
        })
        .json<HotsongRes>()
        .catch(() => ({}) as HotsongRes),
      this.http
        .get("getSingerDesc", { searchParams: { singermid: id } })
        .json<DescRes>()
        .catch(() => ({}) as DescRes),
    ]);

    const songs =
      hotsong.response?.songList
        ?.map((s) => s.musicData)
        .filter(Boolean) ?? [];
    const topTracks = songs.map((s: any, i: number) =>
      mapQQTrackFromSong(s, i + 1),
    );

    const singerInfo = hotsong.response?.singerInfo ?? {};
    const basicInfo = desc.response?.data?.basic_info ?? {};
    const description = desc.response?.data?.info?.desc ?? "";

    return {
      id,
      name: singerInfo.singer_name ?? basicInfo.name ?? "",
      image: singerImage(id, 500),
      banner: singerImage(id, 800),
      description,
      topTracks,
    };
  }

  async lyric(id: string): Promise<Lyric[]> {
    const res = await this.http
      .get("getLyric", { searchParams: { songmid: id } })
      .json<{ response?: { lyric?: string } }>();
    const lrc = res.response?.lyric ?? "";
    if (!lrc) return [];
    return parseLyrics(lrc);
  }

  async playUrls(ids: string[]): Promise<TrackPlayUrl[]> {
    if (ids.length === 0) return [];
    // /getMusicPlay 支持逗号分隔批量
    const res = await this.http
      .get("getMusicPlay", { searchParams: { songmid: ids.join(",") } })
      .json<{
        data?: {
          playUrl?: Record<string, { url: string; error?: string | false }>;
        };
      }>();
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
    // 并行拉 3 块；tracks 留空（QQ 榜单接口不返回 songmid，无法接入播放流，先不渲染）
    const [popularPlaylists, newAlbums, hotSingers] = await Promise.all([
      this.http
        .get("getSongLists", { searchParams: { page: 0, limit: 20 } })
        .json<{ response?: { data?: { list?: any[] } } }>()
        .catch(() => ({ response: { data: { list: [] } } })),
      this.http
        .get("getNewDisks", { searchParams: { page: 2, limit: 10 } })
        .json<{
          response?: { new_album?: { data?: { albums?: any[] } } };
        }>()
        .catch(() => ({ response: { new_album: { data: { albums: [] } } } })),
      this.http
        .get("getSingerList", {
          searchParams: { index: -100, page: 1 },
        })
        .json<{
          response?: { singerList?: { data?: { singerlist?: any[] } } };
        }>()
        .catch(() => ({
          response: { singerList: { data: { singerlist: [] } } },
        })),
    ]);

    const playlists: Partial<Playlist>[] = (
      popularPlaylists.response?.data?.list ?? []
    )
      .slice(0, 10)
      .map(mapQQPlaylistStub);

    const albums: Partial<Album>[] = (
      newAlbums.response?.new_album?.data?.albums ?? []
    )
      .slice(0, 10)
      .map(mapQQNewAlbum);

    const artists: Partial<Artist>[] = (
      hotSingers.response?.singerList?.data?.singerlist ?? []
    )
      .slice(0, 10)
      .map(mapQQArtistFromList);

    return {
      playlists,
      albums,
      artists,
      tracks: [],
    };
  }
}

export default QQMusic;
