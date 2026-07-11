import type { KyInstance } from "ky";
import ky from "ky";

import { Provider } from "../provider";
import type { CatalogPorts, LyricProvider, PlaybackAvailabilityPolicy, ProviderId } from "@domain";
import type { AlbumDetailSnapshot, AlbumSnapshot } from "@domain/model/album";
import type { ArtistDetailSnapshot, ArtistSnapshot } from "@domain/model/artist";
import type { Lyric } from "@domain/model/lyric";
import { parseLyrics } from "@domain/model/lyric";
import type { Personalized } from "@domain/model/personalized";
import type { PlaylistDetailSnapshot, PlaylistSnapshot } from "@domain/model/playlist";
import type { TrackPlayUrl } from "@domain/model/track";
import { SearchResult } from "@domain/model/search";
import type { Chart } from "@domain/model/chart";
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
} from "./mapper";
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
} from "./types";
import { QQMUSIC_PROVIDER_ID, QQMUSIC_PROVIDER_NAME } from "./identity";
import { requireSomeSettled, settledOr } from "../settled";

export type QQMusicOptions = {
  /** Like `http://localhost:3200`; targets the Rain120/qq-music-api server. */
  host: string;
  /** Optional concrete client for deterministic adapter tests. */
  http?: KyInstance;
};

export class QQMusic extends Provider {
  public static readonly ID = QQMUSIC_PROVIDER_ID;
  public static readonly NAME = QQMUSIC_PROVIDER_NAME;
  private readonly http: KyInstance;

  constructor(opts: QQMusicOptions) {
    super();
    this.http = opts.http ?? ky.create({ prefix: opts.host, timeout: 10_000 });
  }

  get name(): string {
    return QQMusic.NAME;
  }

  get providerId(): ProviderId {
    return QQMusic.ID;
  }

  protected get catalogPorts(): CatalogPorts {
    return {
      home: this,
      playlists: this,
      albums: this,
      artists: this,
      tracks: null,
      search: this,
      charts: this,
      musicVideos: null,
      artistMusicVideos: null,
    };
  }

  protected get playbackPolicy(): PlaybackAvailabilityPolicy {
    return { canResolveFullPlayback: true, canUsePreviewPlayback: false };
  }

  protected get lyricsPort(): LyricProvider {
    return this;
  }

  async playlistDetail(id: string): Promise<PlaylistDetailSnapshot | undefined> {
    const res = await this.http
      .get("getSongListDetail", { searchParams: { disstid: id } })
      .json<QQSongListDetailResponse>();
    const detail = res.response?.cdlist?.[0];
    return detail ? mapQQPlaylistDetail(detail) : undefined;
  }

  async albumDetail(id: string): Promise<AlbumDetailSnapshot | undefined> {
    const res = await this.http
      .get("getAlbumInfo", { searchParams: { albummid: id } })
      .json<QQAlbumInfoResponse>();
    const detail = res.response?.data;
    return detail ? mapQQAlbumDetail(detail) : undefined;
  }

  async artistDetail(id: string): Promise<ArtistDetailSnapshot | undefined> {
    // Parallel: top tracks + bio.
    const [hotsongResult, descriptionResult] = await Promise.allSettled([
      this.http
        .get("getSingerHotsong", {
          searchParams: { singermid: id, limit: 10, page: 1 },
        })
        .json<QQSingerHotsongResponse>(),
      this.http
        .get("getSingerDesc", { searchParams: { singermid: id } })
        .json<QQSingerDescriptionResponse>(),
    ]);
    requireSomeSettled(`QQ Music artist detail (${id})`, [hotsongResult, descriptionResult]);
    const hotsong: QQSingerHotsongResponse = settledOr(hotsongResult, {});
    const desc: QQSingerDescriptionResponse = settledOr(descriptionResult, {});

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
      providerId: QQMUSIC_PROVIDER_ID,
      id,
      name: singerInfo.singer_name ?? basicInfo.name ?? "",
      images: artistImage ? [{ url: artistImage }] : [],
      banner: singerImage(id, 800),
      description,
      topTracks,
      albums: [],
      similar: [],
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

  async playUrls(playbackIds: string[]): Promise<TrackPlayUrl[]> {
    if (playbackIds.length === 0) return [];
    // /getMusicPlay accepts comma-separated batches.
    const res = await this.http
      .get("getMusicPlay", { searchParams: { songmid: playbackIds.join(",") } })
      .json<QQMusicPlayResponse>();
    const playUrl = res.data?.playUrl ?? {};
    const out: TrackPlayUrl[] = [];
    for (const [songmid, info] of Object.entries(playUrl)) {
      if (info?.url) {
        out.push({ playbackId: songmid, playUrl: info.url });
      }
    }
    return out;
  }

  async personalized(): Promise<Personalized> {
    // Fetch 3 sections in parallel; tracks are left empty (the QQ chart endpoint returns no songmid, so they cannot join the playback flow and are not rendered yet).
    const [playlistsResult, albumsResult, singersResult] = await Promise.allSettled([
      this.http
        .get("getSongLists", { searchParams: { page: 0, limit: 20 } })
        .json<QQSongListsResponse>(),
      this.http
        .get("getNewDisks", { searchParams: { page: 2, limit: 10 } })
        .json<QQNewDisksResponse>(),
      this.http
        .get("getSingerList", {
          searchParams: { index: -100, page: 1 },
        })
        .json<QQSingerListResponse>(),
    ]);
    const sections = [playlistsResult, albumsResult, singersResult];
    requireSomeSettled("QQ Music personalized sections", sections);
    const popularPlaylists: QQSongListsResponse = settledOr(playlistsResult, {});
    const newAlbums: QQNewDisksResponse = settledOr(albumsResult, {});
    const hotSingers: QQSingerListResponse = settledOr(singersResult, {});

    const playlists: PlaylistSnapshot[] = (popularPlaylists.response?.data?.list ?? [])
      .slice(0, 10)
      .map(mapQQPlaylistStub);

    const albums: AlbumSnapshot[] = (newAlbums.response?.new_album?.data?.albums ?? [])
      .slice(0, 10)
      .map(mapQQNewAlbum);

    const artists: ArtistSnapshot[] = (hotSingers.response?.singerList?.data?.singerlist ?? [])
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
      .json<QQSmartboxResponse>();
    const d = res.response?.data ?? {};
    return {
      tracks: (d.song?.itemlist ?? []).map(mapQQSmartboxSong),
      artists: (d.singer?.itemlist ?? []).map(mapQQSmartboxSinger),
      albums: (d.album?.itemlist ?? []).map(mapQQSmartboxAlbum),
      playlists: [],
    };
  }

  async toplists(): Promise<Chart[]> {
    const res = await this.http.get("getTopLists").json<QQTopListsResponse>();
    return (res.response?.data?.topList ?? []).map(mapQQChart).filter((c) => c.id && c.title);
  }

  async toplistDetail(id: string): Promise<PlaylistDetailSnapshot | undefined> {
    const res = await this.http
      .get("getRanks", { searchParams: { topId: id, limit: 100, page: 0 } })
      .json<QQRanksResponse>();
    const list = res.response?.req_1?.data?.data?.song ?? [];
    const tracks = list.map((s, i) => mapQQRankSong(s, i + 1));
    return {
      providerId: QQMUSIC_PROVIDER_ID,
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
