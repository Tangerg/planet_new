import { Album } from "@domain/model/album";
import { Artist } from "@domain/model/artist";
import { Image } from "@domain/model/image";
import { Playlist } from "@domain/model/playlist";
import { Track } from "@domain/model/track";
import { User } from "@domain/model/user";

/**
 * Mapping from QQ Music fields to the internal model.
 * Targets the Rain120/qq-music-api koa service,
 * which forwards Tencent raw fields verbatim, so most mapping is mid extraction.
 *
 * Image URL rules (verified):
 *   - Album    `https://y.gtimg.cn/music/photo_new/T002R{size}x{size}M000{pmid}.jpg`
 *   - Singer   `https://y.gtimg.cn/music/photo_new/T001R{size}x{size}M000{singermid}.jpg`
 *   - Playlist uses the absolute URL the API returns (imgurl / logo)
 */

const I_HOST = "https://y.gtimg.cn/music/photo_new";

/** Some Tencent image URLs are http://; an HTTPS webview blocks them, so upgrade to https. */
function ensureHttps(url: string | undefined): string {
  if (!url) return "";
  return url.startsWith("http://") ? "https://" + url.slice("http://".length) : url;
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
  // /getSingerList uses snake_case; singer_pic is 150x150, build a 300px image for clarity
  const url = singerImage(raw.singer_mid ?? "", 300) || ensureHttps(raw.singer_pic);
  return {
    id: raw.singer_mid?.toString() ?? "",
    name: raw.singer_name ?? "",
    images: url ? [{ url }] : [],
  };
}

/**
 * Take one song from a playlist response songlist[i].
 * Fields: mid (songmid), name, interval(seconds), singer[], album{pmid|mid}
 */
export function mapQQTrackFromSong(raw: any, index?: number): Partial<Track> {
  const albumMid = raw.album?.pmid ?? raw.album?.mid ?? "";
  const albumUrl = albumImage(albumMid, 300);
  return {
    index,
    id: raw.mid?.toString() ?? "",
    name: raw.name ?? raw.title ?? "",
    durationMs: (raw.interval ?? 0) * 1000,
    artists: (raw.singer ?? []).map(mapQQArtist),
    album: raw.album
      ? {
          id: raw.album.mid?.toString() ?? "",
          name: raw.album.name ?? "",
          images: albumUrl ? [{ url: albumUrl }] : [],
        }
      : undefined,
  };
}

/**
 * Take one song from an album response list[i] (used in album detail).
 * Fields: songmid, songname, singer[], interval, albummid
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
    durationMs: (raw.interval ?? 0) * 1000,
    artists: (raw.singer ?? []).map((s: any) => ({
      id: s.mid?.toString() ?? "",
      name: s.name ?? "",
    })),
    album: {
      id: fallbackAlbum.id,
      name: raw.albumname ?? fallbackAlbum.name,
      images: fallbackAlbum.images ?? [],
    },
  };
}

export function mapQQPlaylistDetail(cd: any): Playlist {
  const tracks = (cd.songlist ?? []).map((s: any, i: number) => mapQQTrackFromSong(s, i + 1));
  const ownerImage = cd.headurl ?? "";
  const owner: Partial<User> = {
    id: cd.encrypt_uin?.toString() ?? "",
    displayName: cd.nickname ?? cd.nick ?? "",
    images: ownerImage ? [{ url: ownerImage }] : [],
  };
  return {
    id: cd.disstid?.toString() ?? cd.dissid?.toString() ?? "",
    name: cd.dissname ?? "",
    description: cd.desc ?? "",
    images: [{ url: ensureHttps(cd.logo) }],
    totalTracks: cd.songnum ?? cd.total_song_num ?? tracks.length,
    owner,
    tracks,
  };
}

export function mapQQAlbumDetail(data: any): Album {
  const albumMid = data.mid ?? "";
  const image = albumImage(albumMid, 500);
  const images: Image[] = image ? [{ url: image }] : [];
  const albumStub: Partial<Album> = {
    id: albumMid?.toString() ?? "",
    name: data.name ?? "",
    images,
  };
  const tracks = (data.list ?? []).map((s: any, i: number) =>
    mapQQTrackFromAlbumList(s, albumStub, i + 1),
  );
  const publishTime = Date.parse(data.aDate ?? "") || 0;
  const singerUrl = data.singermid ? singerImage(data.singermid, 300) : "";
  return {
    id: albumMid,
    name: data.name ?? "",
    alias: [],
    images,
    totalTracks: data.total_song_num ?? data.total ?? tracks.length,
    releaseDate: publishTime ? new Date(publishTime).toISOString().slice(0, 10) : undefined,
    tracks,
    artists: data.singermid
      ? [
          {
            id: data.singermid?.toString() ?? "",
            name: data.singername ?? "",
            images: singerUrl ? [{ url: singerUrl }] : [],
          },
        ]
      : [],
  };
}

/** Recommended-playlist thumbnail data (/getSongLists list item). */
export function mapQQPlaylistStub(raw: any): Partial<Playlist> {
  return {
    id: raw.dissid?.toString() ?? "",
    name: raw.dissname ?? "",
    images: [{ url: ensureHttps(raw.imgurl) }],
    totalTracks: raw.songnum ?? 0,
  };
}

/** smartbox suggestions wrap the matched term in <em>; strip tags for plain text. */
function stripTags(s: string | undefined): string {
  return (s ?? "").replace(/<[^>]+>/g, "");
}

/** Search (/getSmartbox -> response.data.song.itemlist[]): { mid, name, singer(string) } */
export function mapQQSmartboxSong(raw: any): Partial<Track> {
  return {
    id: (raw.mid ?? "").toString(),
    name: stripTags(raw.name),
    durationMs: 0,
    artists: raw.singer ? [{ name: stripTags(raw.singer) }] : [],
  };
}

/** Singer search (/getSmartbox -> response.data.singer.itemlist[]): { mid, name, pic } */
export function mapQQSmartboxSinger(raw: any): Partial<Artist> {
  const mid = (raw.mid ?? "").toString();
  const url = ensureHttps(raw.pic) || singerImage(mid, 300);
  return {
    id: mid,
    name: stripTags(raw.name),
    images: url ? [{ url }] : [],
  };
}

/** Album search (/getSmartbox -> response.data.album.itemlist[]): { mid, name, pic, singer } */
export function mapQQSmartboxAlbum(raw: any): Partial<Album> {
  const mid = (raw.mid ?? "").toString();
  const url = ensureHttps(raw.pic) || albumImage(mid, 300);
  return {
    id: mid,
    name: stripTags(raw.name),
    alias: [],
    images: url ? [{ url }] : [],
    totalTracks: 0,
    artists: raw.singer ? [{ name: stripTags(raw.singer) }] : [],
  };
}

/** Chart list item (/getTopLists -> response.data.topList[]). */
export function mapQQChart(raw: any): {
  id: string;
  title: string;
  image: string;
  period?: string;
} {
  return {
    id: (raw.id ?? raw.topId ?? raw.topid ?? "").toString(),
    title: raw.title ?? raw.topTitle ?? "",
    image: ensureHttps(raw.frontPicUrl ?? raw.headPicUrl ?? raw.picUrl ?? raw.macHeadPicUrl ?? ""),
    period: raw.updateTime ?? raw.intro ?? undefined,
  };
}

/** One song in chart detail (/getRanks -> response.req_1.data.data.song[]).
 *  Fields: songId (numeric id) / title / singerName (string) / singerMid / albumMid / cover (URL) / interval.
 *  Note: this shape gives songId but not songmid, so play URLs cannot be resolved yet (getMusicPlay needs songmid). */
export function mapQQRankSong(raw: any, index?: number): Partial<Track> {
  const albumMid = raw.albumMid ?? raw.album?.mid ?? "";
  const albumUrl = raw.cover ? ensureHttps(raw.cover) : albumImage(albumMid, 300);
  return {
    index,
    id: (raw.songId ?? raw.mid ?? "").toString(),
    name: raw.title ?? raw.name ?? raw.songname ?? "",
    durationMs: (raw.interval ?? 0) * 1000,
    artists: raw.singerName
      ? [{ id: (raw.singerMid ?? "").toString(), name: raw.singerName }]
      : (raw.singer ?? []).map((a: any) => ({ id: (a.mid ?? "").toString(), name: a.name ?? "" })),
    album: {
      id: albumMid?.toString() ?? "",
      name: raw.albumName ?? "",
      images: albumUrl ? [{ url: albumUrl }] : [],
    },
  };
}

/** New album (/getNewDisks list item). */
export function mapQQNewAlbum(raw: any): Partial<Album> {
  const albumMid = raw.mid ?? "";
  const albumUrl = albumImage(albumMid, 300);
  const firstSinger = raw.singers?.[0];
  return {
    id: albumMid?.toString() ?? "",
    name: raw.name ?? "",
    images: albumUrl ? [{ url: albumUrl }] : [],
    totalTracks: raw.ex?.track_nums ?? 0,
    artists: firstSinger
      ? [
          {
            id: firstSinger.mid?.toString() ?? "",
            name: firstSinger.name ?? "",
          },
        ]
      : [],
  };
}
