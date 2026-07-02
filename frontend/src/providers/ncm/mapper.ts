import type { Album } from "@domain/model/album";
import type { Artist } from "@domain/model/artist";
import type { Chart } from "@domain/model/chart";
import type { Comment } from "@domain/model/comment";
import type { Image } from "@domain/model/image";
import type { MusicVideo } from "@domain/model/music-video";
import type { Playlist } from "@domain/model/playlist";
import type { Track } from "@domain/model/track";
import type { User } from "@domain/model/user";
import { httpsUrl } from "@shared/url";
import { toIdString } from "@providers/mapping";
import type {
  NcmAlbum,
  NcmArtist,
  NcmChart,
  NcmComment,
  NcmMusicVideo,
  NcmPlaylist,
  NcmTrack,
  NcmUser,
} from "@providers/ncm/types";

/**
 * Central mapping from NeteaseCloudMusic fields to the internal model.
 * The provider file does HTTP only; all transformation lives here.
 *
 * NCM field abbreviation reference:
 *   tr.al = album, tr.ar = artists, tr.dt = duration(ms),
 *   pl.picUrl / coverImgUrl, ar.img1v1Url
 */

export function resizeImage(url: string | undefined, size: number): string {
  if (!url) return "";
  return `${httpsUrl(url)}?param=${size}y${size}`;
}

/** Square cover variant widths, largest-first (matches the Image[] contract). */
const COVER_WIDTHS = [1024, 512, 256, 96] as const;

/**
 * Multi-resolution variant set for a resizable NCM cover URL. NCM resizes via
 * `?param=WyH`, so one base URL yields every size; <Art> then picks the variant
 * matching its render box (small thumb → small file, hero → large, crisp file).
 */
export function coverSet(url: string | undefined): Image[] {
  if (!url) return [];
  const base = httpsUrl(url);
  return COVER_WIDTHS.map((w) => ({ url: `${base}?param=${w}y${w}`, width: w, height: w }));
}

export function mapNcmArtist(raw: NcmArtist): Partial<Artist> {
  return {
    id: toIdString(raw.id),
    name: raw.name ?? "",
  };
}

export function mapNcmFeaturedArtist(raw: NcmArtist): Partial<Artist> {
  return {
    id: toIdString(raw.id),
    name: raw.name ?? "",
    images: coverSet(raw.img1v1Url),
    alias: raw.alias ?? [],
  };
}

/** Slim album (used when embedded in a track). */
export function mapNcmAlbumStub(raw: NcmAlbum): Partial<Album> {
  return {
    id: toIdString(raw.id),
    name: raw.name ?? "",
    images: coverSet(raw.picUrl),
  };
}

export type MapTrackOptions = {
  /** 1-based track number. */
  index?: number;
  /** Fallback when the raw row has no album (e.g. album-detail tracks missing the al field). */
  fallbackAlbum?: Partial<Album>;
};

/**
 * Normalize an NCM track node (whether `tr` from a playlist, a row from
 * album/songs, or `item.song` from personalized/newsong) into an internal Track.
 */
export function mapNcmTrack(raw: NcmTrack, opts: MapTrackOptions = {}): Partial<Track> {
  const albumRaw = raw.al ?? raw.album;
  const artistsRaw = raw.ar ?? raw.artists ?? [];
  const album = albumRaw ? mapNcmAlbumStub(albumRaw) : opts.fallbackAlbum;
  const mvId = raw.mv ?? raw.mvid ?? raw.mvId;
  const id = toIdString(raw.id);
  return {
    index: opts.index,
    id,
    name: raw.name ?? "",
    durationMs: raw.dt ?? raw.duration ?? 0,
    album,
    artists: artistsRaw.map(mapNcmArtist),
    playbackId: id || undefined,
    musicVideoId: mvId ? mvId.toString() : undefined,
    // Neutral availability facts (see domain Track): fee 1 = VIP tier;
    // noCopyrightRcmd present = NCM holds no licence for the track.
    requiresSubscription: raw.fee === 1,
    available: raw.noCopyrightRcmd == null,
  };
}

export function mapNcmCreator(raw: NcmUser): Partial<User> {
  return {
    id: toIdString(raw.userId ?? raw.id),
    displayName: raw.nickname ?? "",
    images: coverSet(raw.avatarUrl),
  };
}

export function mapNcmPlaylist(raw: NcmPlaylist): Playlist {
  const tracks = (raw.tracks ?? []).map((tr, i) => mapNcmTrack(tr, { index: i + 1 }));
  return {
    id: toIdString(raw.id),
    name: raw.name ?? "",
    description: raw.description ?? "",
    images: coverSet(raw.coverImgUrl),
    totalTracks: raw.trackCount ?? tracks.length,
    owner: mapNcmCreator(raw.creator ?? {}),
    tracks: tracks as Partial<Track>[],
  } as Playlist;
}

/** Playlist thumbnail. `picUrl` on /personalized rows, `coverImgUrl` on search rows. */
export function mapNcmPlaylistStub(raw: NcmPlaylist): Partial<Playlist> {
  return {
    id: toIdString(raw.id),
    name: raw.name ?? "",
    images: coverSet(raw.picUrl ?? raw.coverImgUrl),
    totalTracks: raw.trackCount,
  };
}

/** Chart list item (/toplist -> list[]): each chart is a playlist, so toplistDetail reuses playlistDetail. */
export function mapNcmChart(raw: NcmChart): Chart {
  return {
    id: toIdString(raw.id),
    title: raw.name ?? "",
    // Chart cards render large (full-width tiles); take a high-res single size.
    image: resizeImage(raw.coverImgUrl, 512),
    period: raw.updateFrequency ?? "",
  };
}

export function mapNcmAlbum(raw: NcmAlbum, songs: NcmTrack[]): Album {
  const cover = coverSet(raw.picUrl);
  const albumStub: Partial<Album> = {
    id: toIdString(raw.id),
    name: raw.name ?? "",
    images: cover,
  };
  const tracks = songs.map((tr, i) => mapNcmTrack(tr, { index: i + 1, fallbackAlbum: albumStub }));
  return {
    id: toIdString(raw.id),
    name: raw.name ?? "",
    alias: raw.alias ?? [],
    description: raw.description ?? "",
    images: cover,
    totalTracks: raw.size ?? tracks.length,
    releaseDate: raw.publishTime ? new Date(raw.publishTime).toISOString().slice(0, 10) : undefined,
    artists: raw.artist
      ? [
          {
            id: toIdString(raw.artist.id),
            name: raw.artist.name ?? "",
            images: coverSet(raw.artist.picUrl),
          },
        ]
      : [],
    tracks: tracks as Partial<Track>[],
  } as Album;
}

/** One comment node (/comment/music -> hotComments[] / comments[]). */
export function mapNcmComment(raw: NcmComment): Comment {
  return {
    id: toIdString(raw.commentId ?? raw.id),
    user: {
      name: raw.user?.nickname ?? "",
      avatar: coverSet(raw.user?.avatarUrl),
    },
    content: raw.content ?? "",
    likedCount: raw.likedCount ?? 0,
    time: raw.time ?? 0,
  };
}

export type MapMusicVideoOptions = {
  playUrl?: string;
  playbackResolved?: boolean;
  quality?: number;
  counts?: {
    commentCount?: number;
    likedCount?: number;
    shareCount?: number;
  };
};

export function mapNcmMusicVideo(raw: NcmMusicVideo, opts: MapMusicVideoOptions = {}): MusicVideo {
  const artistsRaw =
    raw.artists ??
    (raw.artistName
      ? [
          {
            id: raw.artistId,
            name: raw.artistName,
          },
        ]
      : []);
  const cover = raw.cover ?? raw.coverUrl ?? raw.imgurl16v9 ?? raw.imgurl;
  return {
    id: toIdString(raw.id ?? raw.mvid),
    name: raw.name ?? raw.title ?? "",
    images: coverSet(cover),
    artists: artistsRaw.map(mapNcmArtist),
    durationMs: raw.duration ?? raw.durationms,
    description: raw.desc ?? raw.description ?? "",
    publishDate: raw.publishTime ?? raw.publishDate,
    playCount: raw.playCount,
    commentCount: opts.counts?.commentCount ?? raw.commentCount,
    likedCount: opts.counts?.likedCount ?? raw.likedCount,
    shareCount: opts.counts?.shareCount ?? raw.shareCount,
    playUrl: opts.playUrl,
    playbackResolved: opts.playbackResolved,
    quality: opts.quality,
  };
}

export function mapNcmAlbumNewest(raw: NcmAlbum): Partial<Album> {
  return {
    id: toIdString(raw.id),
    name: raw.name ?? "",
    totalTracks: raw.size,
    images: coverSet(raw.picUrl),
    artists: raw.artist
      ? [
          {
            id: toIdString(raw.artist.id),
            name: raw.artist.name ?? "",
          },
        ]
      : [],
  };
}
