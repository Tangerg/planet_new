import type { AlbumDetailSnapshot, AlbumReference, AlbumSummary } from "@domain/model/album";
import type { ArtistLink, ArtistSummary } from "@domain/model/artist";
import type { Chart } from "@domain/model/chart";
import type { Image } from "@domain/model/image";
import type { PlaylistDetailSnapshot, PlaylistSummary } from "@domain/model/playlist";
import type { Track } from "@domain/model/track";
import type { User } from "@domain/model/user";
import { httpsUrl } from "@shared/url";
import { secondsToMs, singleImage, toIdString } from "@providers/mapping";
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
import { QQMUSIC_PROVIDER_ID } from "./identity";

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

function optionalId(id: QQId | undefined): string | undefined {
  const value = toIdString(id);
  return value || undefined;
}

export function albumImage(albumMidOrPmid: QQId | undefined, size = 300): string {
  const id = toIdString(albumMidOrPmid);
  if (!id) return "";
  return `${I_HOST}/T002R${size}x${size}M000${id}.jpg`;
}

export function singerImage(singerMid: QQId | undefined, size = 300): string {
  const id = toIdString(singerMid);
  if (!id) return "";
  return `${I_HOST}/T001R${size}x${size}M000${id}.jpg`;
}

function mapQQArtist(raw: QQSinger): ArtistLink {
  return {
    providerId: QQMUSIC_PROVIDER_ID,
    id: toIdString(raw.mid ?? raw.singer_mid),
    name: raw.name ?? raw.singer_name ?? "",
  };
}

export function mapQQArtistFromList(raw: QQSinger): ArtistSummary {
  // /getSingerList uses snake_case; singer_pic is 150x150, build a 300px image for clarity
  const id = raw.singer_mid ?? raw.mid;
  const url = singerImage(id, 300) || httpsUrl(raw.singer_pic);
  return {
    providerId: QQMUSIC_PROVIDER_ID,
    id: toIdString(id),
    name: raw.singer_name ?? raw.name ?? "",
    images: singleImage(url),
  };
}

/**
 * Take one song from a playlist response songlist[i].
 * Fields: mid (songmid), name, interval(seconds), singer[], album{pmid|mid}
 */
export function mapQQTrackFromSong(raw: QQTrack, index?: number): Track {
  const albumMid = raw.album?.pmid ?? raw.album?.mid ?? "";
  const albumUrl = albumImage(albumMid, 300);
  const id = toIdString(raw.mid ?? raw.songmid);
  return {
    providerId: QQMUSIC_PROVIDER_ID,
    index,
    id,
    playbackId: optionalId(raw.mid ?? raw.songmid),
    name: raw.name ?? raw.title ?? "",
    durationMs: secondsToMs(raw.interval),
    artists: (raw.singer ?? []).map(mapQQArtist),
    album: raw.album
      ? {
          providerId: QQMUSIC_PROVIDER_ID,
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
  fallbackAlbum: AlbumReference,
  index?: number,
): Track {
  const id = toIdString(raw.songmid ?? raw.mid);
  return {
    providerId: QQMUSIC_PROVIDER_ID,
    index,
    id,
    playbackId: optionalId(raw.songmid ?? raw.mid),
    name: raw.songname ?? raw.name ?? raw.title ?? "",
    durationMs: secondsToMs(raw.interval),
    artists: (raw.singer ?? []).map(mapQQArtist),
    album: {
      providerId: QQMUSIC_PROVIDER_ID,
      id: fallbackAlbum.id,
      name: raw.albumname ?? fallbackAlbum.name,
      images: fallbackAlbum.images ?? [],
    },
  };
}

export function mapQQPlaylistDetail(cd: QQPlaylistDetail): PlaylistDetailSnapshot {
  const tracks = (cd.songlist ?? []).map((s, i) => mapQQTrackFromSong(s, i + 1));
  const ownerImage = cd.headurl ?? "";
  const owner: Partial<User> = {
    id: toIdString(cd.encrypt_uin),
    displayName: cd.nickname ?? cd.nick ?? "",
    images: singleImage(ownerImage),
  };
  return {
    providerId: QQMUSIC_PROVIDER_ID,
    id: toIdString(cd.disstid ?? cd.dissid),
    name: cd.dissname ?? "",
    description: cd.desc ?? "",
    images: singleImage(httpsUrl(cd.logo)),
    totalTracks: cd.songnum ?? cd.total_song_num ?? tracks.length,
    owner,
    tracks,
  };
}

export function mapQQAlbumDetail(data: QQAlbumDetail): AlbumDetailSnapshot {
  const albumMid = data.mid ?? "";
  const image = albumImage(albumMid, 500);
  const images: Image[] = singleImage(image);
  const albumStub: AlbumReference = {
    providerId: QQMUSIC_PROVIDER_ID,
    id: toIdString(albumMid),
    name: data.name ?? "",
    images,
  };
  const tracks = (data.list ?? []).map((s, i) => mapQQTrackFromAlbumList(s, albumStub, i + 1));
  const publishTime = data.aDate ? Date.parse(data.aDate) : Number.NaN;
  const singerUrl = data.singermid ? singerImage(data.singermid, 300) : "";
  return {
    providerId: QQMUSIC_PROVIDER_ID,
    id: toIdString(albumMid),
    name: data.name ?? "",
    alias: [],
    images,
    totalTracks: data.total_song_num ?? data.total ?? tracks.length,
    releaseDate: Number.isNaN(publishTime)
      ? undefined
      : new Date(publishTime).toISOString().slice(0, 10),
    tracks,
    artists: data.singermid
      ? [
          {
            providerId: QQMUSIC_PROVIDER_ID,
            id: toIdString(data.singermid),
            name: data.singername ?? "",
            images: singleImage(singerUrl),
          },
        ]
      : [],
  };
}

/** Recommended-playlist thumbnail data (/getSongLists list item). */
export function mapQQPlaylistStub(raw: QQPlaylistStub): PlaylistSummary {
  return {
    providerId: QQMUSIC_PROVIDER_ID,
    id: toIdString(raw.dissid),
    name: raw.dissname ?? "",
    images: singleImage(httpsUrl(raw.imgurl)),
    totalTracks: raw.songnum ?? 0,
  };
}

/** smartbox suggestions wrap the matched term in <em>; strip tags for plain text. */
function stripTags(s: string | undefined): string {
  return (s ?? "").replace(/<[^>]+>/g, "");
}

/** A smartbox row credits its artist as one display string, not an artist list,
 *  so the credit has a name and no id to navigate to. */
function smartboxArtists(singer: string | undefined): ArtistLink[] {
  return singer ? [{ providerId: QQMUSIC_PROVIDER_ID, name: stripTags(singer) }] : [];
}

/** Search (/getSmartbox -> response.data.song.itemlist[]): { mid, name, singer(string) } */
export function mapQQSmartboxSong(raw: QQSmartboxItem): Track {
  const id = toIdString(raw.mid);
  return {
    providerId: QQMUSIC_PROVIDER_ID,
    id,
    playbackId: optionalId(raw.mid),
    name: stripTags(raw.name),
    durationMs: 0,
    artists: smartboxArtists(raw.singer),
  };
}

/** Singer search (/getSmartbox -> response.data.singer.itemlist[]): { mid, name, pic } */
export function mapQQSmartboxSinger(raw: QQSmartboxItem): ArtistSummary {
  const mid = toIdString(raw.mid);
  const url = httpsUrl(raw.pic) || singerImage(mid, 300);
  return {
    providerId: QQMUSIC_PROVIDER_ID,
    id: mid,
    name: stripTags(raw.name),
    images: singleImage(url),
  };
}

/** Album search (/getSmartbox -> response.data.album.itemlist[]): { mid, name, pic, singer } */
export function mapQQSmartboxAlbum(raw: QQSmartboxItem): AlbumSummary {
  const mid = toIdString(raw.mid);
  const url = httpsUrl(raw.pic) || albumImage(mid, 300);
  return {
    providerId: QQMUSIC_PROVIDER_ID,
    id: mid,
    name: stripTags(raw.name),
    alias: [],
    images: singleImage(url),
    totalTracks: 0,
    artists: smartboxArtists(raw.singer),
  };
}

/** Chart list item (/getTopLists -> response.data.topList[]). */
export function mapQQChart(raw: QQChart): Chart {
  return {
    providerId: QQMUSIC_PROVIDER_ID,
    id: toIdString(raw.id ?? raw.topId ?? raw.topid),
    title: raw.title ?? raw.topTitle ?? "",
    image: httpsUrl(raw.frontPicUrl ?? raw.headPicUrl ?? raw.picUrl ?? raw.macHeadPicUrl ?? ""),
    period: raw.updateTime ?? raw.intro ?? undefined,
  };
}

/** One song in chart detail (/getRanks -> response.req_1.data.data.song[]).
 *  Fields: songId (numeric id) / title / singerName (string) / singerMid / albumMid / cover (URL) / interval.
 *  Note: this shape gives songId but not songmid, so play URLs cannot be resolved yet (getMusicPlay needs songmid). */
export function mapQQRankSong(raw: QQTrack, index?: number): Track {
  const albumMid = raw.albumMid ?? raw.album?.mid ?? "";
  const albumUrl = raw.cover ? httpsUrl(raw.cover) : albumImage(albumMid, 300);
  const playbackId = optionalId(raw.mid ?? raw.songmid);
  return {
    providerId: QQMUSIC_PROVIDER_ID,
    index,
    id: toIdString(raw.songId ?? raw.mid ?? raw.songmid),
    playbackId,
    name: raw.title ?? raw.name ?? raw.songname ?? "",
    durationMs: secondsToMs(raw.interval),
    // Chart rows flatten the credit to singerName/singerMid; when they don't,
    // the row carries the ordinary singer list, so map it the ordinary way —
    // an inline copy here silently dropped the snake_case field fallbacks.
    artists: raw.singerName
      ? [
          {
            providerId: QQMUSIC_PROVIDER_ID,
            id: toIdString(raw.singerMid),
            name: raw.singerName,
          },
        ]
      : (raw.singer ?? []).map(mapQQArtist),
    album: {
      providerId: QQMUSIC_PROVIDER_ID,
      id: toIdString(albumMid),
      name: raw.albumName ?? "",
      images: singleImage(albumUrl),
    },
  };
}

/** New album (/getNewDisks list item). */
export function mapQQNewAlbum(raw: QQNewAlbum): AlbumSummary {
  const albumMid = raw.mid ?? "";
  const albumUrl = albumImage(albumMid, 300);
  const firstSinger = raw.singers?.[0];
  return {
    providerId: QQMUSIC_PROVIDER_ID,
    id: toIdString(albumMid),
    name: raw.name ?? "",
    images: singleImage(albumUrl),
    totalTracks: raw.ex?.track_nums ?? 0,
    artists: firstSinger ? [mapQQArtist(firstSinger)] : [],
  };
}
