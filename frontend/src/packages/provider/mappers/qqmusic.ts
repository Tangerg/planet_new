import { Album } from "../../model/album";
import { Artist } from "../../model/artist";
import { Playlist } from "../../model/playlist";
import { Track } from "../../model/track";
import { User } from "../../model/user";

/**
 * QQ Music 字段 → 内部 model 的映射。
 * 对接的是 https://github.com/Rain120/qq-music-api 这套 koa 服务，
 * 它直接转发腾讯接口的原始字段，所以多数 mapping 是 mid 的提取。
 *
 * 图片 URL 规则（已验证）：
 *   - Album    `https://y.gtimg.cn/music/photo_new/T002R{size}x{size}M000{pmid}.jpg`
 *   - Singer   `https://y.gtimg.cn/music/photo_new/T001R{size}x{size}M000{singermid}.jpg`
 *   - Playlist 直接用接口返回的绝对 URL（imgurl / logo）
 */

const I_HOST = "https://y.gtimg.cn/music/photo_new";

/** 腾讯接口里部分图片 URL 是 http://，webview/HTTPS 页面会拦截，统一升级 */
function ensureHttps(url: string | undefined): string {
  if (!url) return "";
  return url.startsWith("http://")
    ? "https://" + url.slice("http://".length)
    : url;
}

export function albumImage(albumMidOrPmid: string, size = 300): string {
  if (!albumMidOrPmid) return "";
  return `${I_HOST}/T002R${size}x${size}M000${albumMidOrPmid}.jpg`;
}

export function singerImage(singerMid: string, size = 300): string {
  if (!singerMid) return "";
  return `${I_HOST}/T001R${size}x${size}M000${singerMid}.jpg`;
}

export function mapQQArtist(raw: any): Partial<Artist> {
  return {
    id: raw.mid?.toString() ?? raw.singer_mid?.toString() ?? "",
    name: raw.name ?? raw.singer_name ?? "",
  };
}

export function mapQQArtistFromList(raw: any): Partial<Artist> {
  // /getSingerList 用 snake_case；singer_pic 是 150x150，构造 300 大图更清楚
  return {
    id: raw.singer_mid?.toString() ?? "",
    name: raw.singer_name ?? "",
    image: singerImage(raw.singer_mid ?? "", 300) || ensureHttps(raw.singer_pic),
  };
}

/**
 * 从 playlist 接口里的 songlist[i] 取一首歌。
 * 字段：mid (songmid), name, interval(秒), singer[], album{pmid|mid}
 */
export function mapQQTrackFromSong(raw: any, index?: number): Partial<Track> {
  const albumMid = raw.album?.pmid ?? raw.album?.mid ?? "";
  return {
    index,
    id: raw.mid?.toString() ?? "",
    name: raw.name ?? raw.title ?? "",
    duration: (raw.interval ?? 0) * 1000,
    artists: (raw.singer ?? []).map(mapQQArtist),
    album: raw.album
      ? {
          id: raw.album.mid?.toString() ?? "",
          name: raw.album.name ?? "",
          image: albumImage(albumMid, 300),
        }
      : undefined,
  };
}

/**
 * 从 album 接口的 list[i] 取一首歌（专辑详情里用）。
 * 字段：songmid, songname, singer[], interval, albummid
 */
export function mapQQTrackFromAlbumList(
  raw: any,
  fallbackAlbum: Partial<Album>,
  index?: number,
): Partial<Track> {
  return {
    index,
    id: raw.songmid?.toString() ?? "",
    name: raw.songname ?? "",
    duration: (raw.interval ?? 0) * 1000,
    artists: (raw.singer ?? []).map((s: any) => ({
      id: s.mid?.toString() ?? "",
      name: s.name ?? "",
    })),
    album: {
      id: fallbackAlbum.id,
      name: raw.albumname ?? fallbackAlbum.name,
      image: fallbackAlbum.image,
    },
  };
}

export function mapQQPlaylistDetail(cd: any): Playlist {
  const tracks = (cd.songlist ?? []).map((s: any, i: number) =>
    mapQQTrackFromSong(s, i + 1),
  );
  const durationCount = tracks.reduce(
    (acc: number, t: Partial<Track>) => acc + (t.duration ?? 0),
    0,
  );
  const creator: Partial<User> = {
    id: cd.encrypt_uin?.toString() ?? "",
    nickname: cd.nickname ?? cd.nick ?? "",
    image: cd.headurl ?? "",
  };
  return {
    id: cd.disstid?.toString() ?? cd.dissid?.toString() ?? "",
    name: cd.dissname ?? "",
    description: cd.desc ?? "",
    tags: (cd.tags ?? []).map((t: any) => t.name).filter(Boolean),
    image: ensureHttps(cd.logo),
    createTime: (cd.ctime ?? 0) * 1000,
    trackCount: cd.songnum ?? cd.total_song_num ?? tracks.length,
    durationCount,
    creator,
    tracks,
  };
}

export function mapQQAlbumDetail(data: any): Album {
  const albumMid = data.mid ?? "";
  const image = albumImage(albumMid, 500);
  const albumStub: Partial<Album> = {
    id: albumMid?.toString() ?? "",
    name: data.name ?? "",
    image,
  };
  const tracks = (data.list ?? []).map((s: any, i: number) =>
    mapQQTrackFromAlbumList(s, albumStub, i + 1),
  );
  const durationCount = tracks.reduce(
    (acc: number, t: Partial<Track>) => acc + (t.duration ?? 0),
    0,
  );
  return {
    id: albumMid,
    name: data.name ?? "",
    alias: [],
    image,
    trackCount: data.total_song_num ?? data.total ?? tracks.length,
    durationCount,
    publishTime: Date.parse(data.aDate ?? "") || 0,
    tracks,
    artist: data.singermid
      ? {
          id: data.singermid?.toString() ?? "",
          name: data.singername ?? "",
          image: singerImage(data.singermid, 300),
        }
      : undefined,
  };
}

/** 推荐歌单缩略数据（/getSongLists 列表项） */
export function mapQQPlaylistStub(raw: any): Partial<Playlist> {
  return {
    id: raw.dissid?.toString() ?? "",
    name: raw.dissname ?? "",
    image: ensureHttps(raw.imgurl),
    trackCount: raw.songnum ?? 0,
  };
}

/** 新专辑（/getNewDisks 列表项） */
export function mapQQNewAlbum(raw: any): Partial<Album> {
  const albumMid = raw.mid ?? "";
  const firstSinger = raw.singers?.[0];
  return {
    id: albumMid?.toString() ?? "",
    name: raw.name ?? "",
    image: albumImage(albumMid, 300),
    trackCount: raw.ex?.track_nums ?? 0,
    artist: firstSinger
      ? {
          id: firstSinger.mid?.toString() ?? "",
          name: firstSinger.name ?? "",
        }
      : undefined,
  };
}
