import type { Album } from "@domain/model/album";
import type { Artist } from "@domain/model/artist";
import type { Image } from "@domain/model/image";
import type { Playlist } from "@domain/model/playlist";
import type { Track } from "@domain/model/track";
import type { User } from "@domain/model/user";
import { httpsUrl } from "@shared/url";
import { secondsToMs, singleImage, toIdString } from "@providers/mappers/common";
import type {
  QQAlbumDetail,
  QQChart,
  QQId,
  QQNewAlbum,
  QQPlaylistDetail,
  QQPlaylistStub,
  QQSinger,
  QQSmartboxItem,
  QQTrack,
} from "@providers/qqmusic/types";

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

export function albumImage(albumMidOrPmid: QQId | undefined, size = 300): string {
  if (!albumMidOrPmid) return "";
  return `${I_HOST}/T002R${size}x${size}M000${albumMidOrPmid}.jpg`;
}

export function singerImage(singerMid: QQId | undefined, size = 300): string {
  if (!singerMid) return "";
  return `${I_HOST}/T001R${size}x${size}M000${singerMid}.jpg`;
}

export function mapQQArtist(raw: QQSinger): Partial<Artist> {
  return {
    id: toIdString(raw.mid ?? raw.singer_mid),
    name: raw.name ?? raw.singer_name ?? "",
  };
}

export function mapQQArtistFromList(raw: QQSinger): Partial<Artist> {
  // /getSingerList uses snake_case; singer_pic is 150x150, build a 300px image for clarity
  const url = singerImage(raw.singer_mid ?? "", 300) || httpsUrl(raw.singer_pic);
  return {
    id: toIdString(raw.singer_mid),
    name: raw.singer_name ?? "",
    images: singleImage(url),
  };
}

/**
 * Take one song from a playlist response songlist[i].
 * Fields: mid (songmid), name, interval(seconds), singer[], album{pmid|mid}
 */
export function mapQQTrackFromSong(raw: QQTrack, index?: number): Partial<Track> {
  const albumMid = raw.album?.pmid ?? raw.album?.mid ?? "";
  const albumUrl = albumImage(albumMid, 300);
  return {
    index,
    id: toIdString(raw.mid),
    name: raw.name ?? raw.title ?? "",
    durationMs: secondsToMs(raw.interval),
    artists: (raw.singer ?? []).map(mapQQArtist),
    album: raw.album
      ? {
          id: toIdString(raw.album.mid),
          name: raw.album.name ?? "",
          images: singleImage(albumUrl),
        }
      : undefined,
  };
}

/**
 * Take one song from an album response list[i] (used in album detail).
 * Fields: songmid, songname, singer[], interval, albummid
 */
export function mapQQTrackFromAlbumList(
  raw: QQTrack,
  fallbackAlbum: Partial<Album>,
  index?: number,
): Partial<Track> {
  return {
    index,
    id: toIdString(raw.songmid),
    name: raw.songname ?? "",
    durationMs: secondsToMs(raw.interval),
    artists: (raw.singer ?? []).map((s) => ({
      id: toIdString(s.mid),
      name: s.name ?? "",
    })),
    album: {
      id: fallbackAlbum.id,
      name: raw.albumname ?? fallbackAlbum.name,
      images: fallbackAlbum.images ?? [],
    },
  };
}

export function mapQQPlaylistDetail(cd: QQPlaylistDetail): Playlist {
  const tracks = (cd.songlist ?? []).map((s, i) => mapQQTrackFromSong(s, i + 1));
  const ownerImage = cd.headurl ?? "";
  const owner: Partial<User> = {
    id: toIdString(cd.encrypt_uin),
    displayName: cd.nickname ?? cd.nick ?? "",
    images: singleImage(ownerImage),
  };
  return {
    id: toIdString(cd.disstid ?? cd.dissid),
    name: cd.dissname ?? "",
    description: cd.desc ?? "",
    images: [{ url: httpsUrl(cd.logo) }],
    totalTracks: cd.songnum ?? cd.total_song_num ?? tracks.length,
    owner,
    tracks,
  };
}

export function mapQQAlbumDetail(data: QQAlbumDetail): Album {
  const albumMid = data.mid ?? "";
  const image = albumImage(albumMid, 500);
  const images: Image[] = singleImage(image);
  const albumStub: Partial<Album> = {
    id: toIdString(albumMid),
    name: data.name ?? "",
    images,
  };
  const tracks = (data.list ?? []).map((s, i) => mapQQTrackFromAlbumList(s, albumStub, i + 1));
  const publishTime = Date.parse(data.aDate ?? "") || 0;
  const singerUrl = data.singermid ? singerImage(data.singermid, 300) : "";
  return {
    id: toIdString(albumMid),
    name: data.name ?? "",
    alias: [],
    images,
    totalTracks: data.total_song_num ?? data.total ?? tracks.length,
    releaseDate: publishTime ? new Date(publishTime).toISOString().slice(0, 10) : undefined,
    tracks,
    artists: data.singermid
      ? [
          {
            id: toIdString(data.singermid),
            name: data.singername ?? "",
            images: singleImage(singerUrl),
          },
        ]
      : [],
  };
}

/** Recommended-playlist thumbnail data (/getSongLists list item). */
export function mapQQPlaylistStub(raw: QQPlaylistStub): Partial<Playlist> {
  return {
    id: toIdString(raw.dissid),
    name: raw.dissname ?? "",
    images: [{ url: httpsUrl(raw.imgurl) }],
    totalTracks: raw.songnum ?? 0,
  };
}

/** smartbox suggestions wrap the matched term in <em>; strip tags for plain text. */
function stripTags(s: string | undefined): string {
  return (s ?? "").replace(/<[^>]+>/g, "");
}

/** Search (/getSmartbox -> response.data.song.itemlist[]): { mid, name, singer(string) } */
export function mapQQSmartboxSong(raw: QQSmartboxItem): Partial<Track> {
  return {
    id: toIdString(raw.mid),
    name: stripTags(raw.name),
    durationMs: 0,
    artists: raw.singer ? [{ name: stripTags(raw.singer) }] : [],
  };
}

/** Singer search (/getSmartbox -> response.data.singer.itemlist[]): { mid, name, pic } */
export function mapQQSmartboxSinger(raw: QQSmartboxItem): Partial<Artist> {
  const mid = toIdString(raw.mid);
  const url = httpsUrl(raw.pic) || singerImage(mid, 300);
  return {
    id: mid,
    name: stripTags(raw.name),
    images: singleImage(url),
  };
}

/** Album search (/getSmartbox -> response.data.album.itemlist[]): { mid, name, pic, singer } */
export function mapQQSmartboxAlbum(raw: QQSmartboxItem): Partial<Album> {
  const mid = toIdString(raw.mid);
  const url = httpsUrl(raw.pic) || albumImage(mid, 300);
  return {
    id: mid,
    name: stripTags(raw.name),
    alias: [],
    images: singleImage(url),
    totalTracks: 0,
    artists: raw.singer ? [{ name: stripTags(raw.singer) }] : [],
  };
}

/** Chart list item (/getTopLists -> response.data.topList[]). */
export function mapQQChart(raw: QQChart): {
  id: string;
  title: string;
  image: string;
  period?: string;
} {
  return {
    id: toIdString(raw.id ?? raw.topId ?? raw.topid),
    title: raw.title ?? raw.topTitle ?? "",
    image: httpsUrl(raw.frontPicUrl ?? raw.headPicUrl ?? raw.picUrl ?? raw.macHeadPicUrl ?? ""),
    period: raw.updateTime ?? raw.intro ?? undefined,
  };
}

/** One song in chart detail (/getRanks -> response.req_1.data.data.song[]).
 *  Fields: songId (numeric id) / title / singerName (string) / singerMid / albumMid / cover (URL) / interval.
 *  Note: this shape gives songId but not songmid, so play URLs cannot be resolved yet (getMusicPlay needs songmid). */
export function mapQQRankSong(raw: QQTrack, index?: number): Partial<Track> {
  const albumMid = raw.albumMid ?? raw.album?.mid ?? "";
  const albumUrl = raw.cover ? httpsUrl(raw.cover) : albumImage(albumMid, 300);
  return {
    index,
    id: toIdString(raw.songId ?? raw.mid),
    name: raw.title ?? raw.name ?? raw.songname ?? "",
    durationMs: secondsToMs(raw.interval),
    artists: raw.singerName
      ? [{ id: toIdString(raw.singerMid), name: raw.singerName }]
      : (raw.singer ?? []).map((a) => ({ id: toIdString(a.mid), name: a.name ?? "" })),
    album: {
      id: toIdString(albumMid),
      name: raw.albumName ?? "",
      images: singleImage(albumUrl),
    },
  };
}

/** New album (/getNewDisks list item). */
export function mapQQNewAlbum(raw: QQNewAlbum): Partial<Album> {
  const albumMid = raw.mid ?? "";
  const albumUrl = albumImage(albumMid, 300);
  const firstSinger = raw.singers?.[0];
  return {
    id: toIdString(albumMid),
    name: raw.name ?? "",
    images: singleImage(albumUrl),
    totalTracks: raw.ex?.track_nums ?? 0,
    artists: firstSinger
      ? [
          {
            id: toIdString(firstSinger.mid),
            name: firstSinger.name ?? "",
          },
        ]
      : [],
  };
}
