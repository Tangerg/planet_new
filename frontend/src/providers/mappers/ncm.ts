import { Album } from "@domain/model/album";
import { Artist } from "@domain/model/artist";
import { Chart } from "@domain/model/chart";
import { Comment } from "@domain/model/comment";
import { Image } from "@domain/model/image";
import { Playlist } from "@domain/model/playlist";
import { Track } from "@domain/model/track";
import { User } from "@domain/model/user";

/**
 * Central mapping from NeteaseCloudMusic fields to the internal model.
 * The provider file does HTTP only; all transformation lives here.
 *
 * NCM field abbreviation reference:
 *   tr.al = album, tr.ar = artists, tr.dt = duration(ms),
 *   pl.picUrl / coverImgUrl, ar.img1v1Url
 */

/** NCM serves many image URLs over http; the app runs in a secure-context
 *  webview where http subresources are blocked as mixed content, so upgrade to
 *  https (the CDN serves both). Mirrors the QQ mapper's ensureHttps. */
export function toHttps(url: string | undefined): string {
  return (url ?? "").replace(/^http:\/\//, "https://");
}

export function resizeImage(url: string | undefined, size: number): string {
  if (!url) return "";
  return `${toHttps(url)}?param=${size}y${size}`;
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
  const base = toHttps(url);
  return COVER_WIDTHS.map((w) => ({ url: `${base}?param=${w}y${w}`, width: w, height: w }));
}

export function mapNcmArtist(raw: any): Partial<Artist> {
  return {
    id: raw.id?.toString() ?? "",
    name: raw.name,
  };
}

export function mapNcmFeaturedArtist(raw: any): Partial<Artist> {
  return {
    id: raw.id?.toString() ?? "",
    name: raw.name,
    images: coverSet(raw.img1v1Url),
    alias: raw.alias ?? [],
  };
}

/** Slim album (used when embedded in a track). */
export function mapNcmAlbumStub(raw: any): Partial<Album> {
  return {
    id: raw.id?.toString() ?? "",
    name: raw.name,
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
export function mapNcmTrack(raw: any, opts: MapTrackOptions = {}): Partial<Track> {
  const albumRaw = raw.al ?? raw.album;
  const artistsRaw = raw.ar ?? raw.artists ?? [];
  const album = albumRaw ? mapNcmAlbumStub(albumRaw) : opts.fallbackAlbum;
  return {
    index: opts.index,
    id: raw.id?.toString() ?? "",
    name: raw.name,
    durationMs: raw.dt ?? raw.duration ?? 0,
    album,
    artists: artistsRaw.map(mapNcmArtist),
  };
}

export function mapNcmCreator(raw: any): Partial<User> {
  return {
    id: raw.userId?.toString() ?? raw.id?.toString() ?? "",
    displayName: raw.nickname,
    images: coverSet(raw.avatarUrl),
  };
}

export function mapNcmPlaylist(raw: any): Playlist {
  const tracks = (raw.tracks ?? []).map((tr: any, i: number) => mapNcmTrack(tr, { index: i + 1 }));
  return {
    id: raw.id?.toString() ?? "",
    name: raw.name,
    description: raw.description ?? "",
    images: coverSet(raw.coverImgUrl),
    totalTracks: raw.trackCount ?? tracks.length,
    owner: mapNcmCreator(raw.creator ?? {}),
    tracks: tracks as Partial<Track>[],
  } as Playlist;
}

/** Playlist thumbnail. `picUrl` on /personalized rows, `coverImgUrl` on search rows. */
export function mapNcmPlaylistStub(raw: any): Partial<Playlist> {
  return {
    id: raw.id?.toString() ?? "",
    name: raw.name,
    images: coverSet(raw.picUrl ?? raw.coverImgUrl),
    totalTracks: raw.trackCount,
  };
}

/** Chart list item (/toplist -> list[]): each chart is a playlist, so toplistDetail reuses playlistDetail. */
export function mapNcmChart(raw: any): Chart {
  return {
    id: raw.id?.toString() ?? "",
    title: raw.name ?? "",
    // Chart cards render large (full-width tiles); take a high-res single size.
    image: resizeImage(raw.coverImgUrl, 512),
    period: raw.updateFrequency ?? "",
  };
}

export function mapNcmAlbum(raw: any, songs: any[]): Album {
  const cover = coverSet(raw.picUrl);
  const albumStub: Partial<Album> = {
    id: raw.id?.toString() ?? "",
    name: raw.name,
    images: cover,
  };
  const tracks = songs.map((tr: any, i: number) =>
    mapNcmTrack(tr, { index: i + 1, fallbackAlbum: albumStub }),
  );
  return {
    id: raw.id?.toString() ?? "",
    name: raw.name,
    alias: raw.alias ?? [],
    images: cover,
    totalTracks: raw.size ?? tracks.length,
    releaseDate: raw.publishTime ? new Date(raw.publishTime).toISOString().slice(0, 10) : undefined,
    artists: raw.artist
      ? [
          {
            id: raw.artist.id?.toString() ?? "",
            name: raw.artist.name,
            images: coverSet(raw.artist.picUrl),
          },
        ]
      : [],
    tracks: tracks as Partial<Track>[],
  } as Album;
}

/** One comment node (/comment/music -> hotComments[] / comments[]). */
export function mapNcmComment(raw: any): Comment {
  return {
    id: (raw.commentId ?? raw.id ?? "").toString(),
    user: {
      name: raw.user?.nickname ?? "",
      avatar: coverSet(raw.user?.avatarUrl),
    },
    content: raw.content ?? "",
    likedCount: raw.likedCount ?? 0,
    time: raw.time ?? 0,
  };
}

export function mapNcmAlbumNewest(raw: any): Partial<Album> {
  return {
    id: raw.id?.toString() ?? "",
    name: raw.name,
    totalTracks: raw.size,
    images: coverSet(raw.picUrl),
    artists: raw.artist
      ? [
          {
            id: raw.artist.id?.toString() ?? "",
            name: raw.artist.name,
          },
        ]
      : [],
  };
}
