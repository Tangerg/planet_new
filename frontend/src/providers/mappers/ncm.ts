import { Album } from "@domain/model/album";
import { Artist } from "@domain/model/artist";
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

export function resizeImage(url: string | undefined, size: number): string {
    if (!url) return "";
    return `${url}?param=${size}y${size}`;
}

export function mapNcmArtist(raw: any): Partial<Artist> {
    return {
        id: raw.id?.toString() ?? "",
        name: raw.name,
    };
}

export function mapNcmFeaturedArtist(raw: any): Partial<Artist> {
    const img = resizeImage(raw.img1v1Url, 200);
    return {
        id: raw.id?.toString() ?? "",
        name: raw.name,
        images: img ? [{ url: img }] : [],
        alias: raw.alias ?? [],
    };
}

/** Slim album (used when embedded in a track). */
export function mapNcmAlbumStub(raw: any, imageSize = 40): Partial<Album> {
    const img = resizeImage(raw.picUrl, imageSize);
    return {
        id: raw.id?.toString() ?? "",
        name: raw.name,
        images: img ? [{ url: img }] : [],
    };
}

export type MapTrackOptions = {
    /** 1-based track number. */
    index?: number;
    /** Fallback when the raw row has no album (e.g. album-detail tracks missing the al field). */
    fallbackAlbum?: Partial<Album>;
    /** Album cover size (NCM controls it via a query param). */
    albumImageSize?: number;
};

/**
 * Normalize an NCM track node (whether `tr` from a playlist, a row from
 * album/songs, or `item.song` from personalized/newsong) into an internal Track.
 */
export function mapNcmTrack(raw: any, opts: MapTrackOptions = {}): Partial<Track> {
    const albumRaw = raw.al ?? raw.album;
    const artistsRaw = raw.ar ?? raw.artists ?? [];
    const album = albumRaw
        ? mapNcmAlbumStub(albumRaw, opts.albumImageSize ?? 40)
        : opts.fallbackAlbum;
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
    const avatar = resizeImage(raw.avatarUrl, 40);
    return {
        id: raw.userId?.toString() ?? raw.id?.toString() ?? "",
        displayName: raw.nickname,
        images: avatar ? [{ url: avatar }] : [],
    };
}

export function mapNcmPlaylist(raw: any): Playlist {
    const tracks = (raw.tracks ?? []).map((tr: any, i: number) =>
        mapNcmTrack(tr, { index: i + 1, albumImageSize: 40 }),
    );
    const cover = resizeImage(raw.coverImgUrl, 100);
    return {
        id: raw.id?.toString() ?? "",
        name: raw.name,
        description: raw.description ?? "",
        images: cover ? [{ url: cover }] : [],
        totalTracks: raw.trackCount ?? tracks.length,
        owner: mapNcmCreator(raw.creator ?? {}),
        tracks: tracks as Partial<Track>[],
    } as Playlist;
}

export function mapNcmPlaylistStub(raw: any): Partial<Playlist> {
    const cover = resizeImage(raw.picUrl, 200);
    return {
        id: raw.id?.toString() ?? "",
        name: raw.name,
        images: cover ? [{ url: cover }] : [],
        totalTracks: raw.trackCount,
    };
}

export function mapNcmAlbum(raw: any, songs: any[]): Album {
    const cover: string = raw.picUrl ?? "";
    const albumStub: Partial<Album> = {
        id: raw.id?.toString() ?? "",
        name: raw.name,
        images: cover ? [{ url: cover }] : [],
    };
    const tracks = songs.map((tr: any, i: number) =>
        mapNcmTrack(tr, { index: i + 1, fallbackAlbum: albumStub }),
    );
    const artistImg: string = raw.artist?.picUrl ?? "";
    return {
        id: raw.id?.toString() ?? "",
        name: raw.name,
        alias: raw.alias ?? [],
        images: cover ? [{ url: cover }] : [],
        totalTracks: raw.size ?? tracks.length,
        releaseDate: raw.publishTime
            ? new Date(raw.publishTime).toISOString().slice(0, 10)
            : undefined,
        artists: raw.artist
            ? [
                  {
                      id: raw.artist.id?.toString() ?? "",
                      name: raw.artist.name,
                      images: artistImg ? [{ url: artistImg }] : [],
                  },
              ]
            : [],
        tracks: tracks as Partial<Track>[],
    } as Album;
}

export function mapNcmAlbumNewest(raw: any): Partial<Album> {
    const cover = resizeImage(raw.picUrl, 200);
    return {
        id: raw.id?.toString() ?? "",
        name: raw.name,
        totalTracks: raw.size,
        images: cover ? [{ url: cover }] : [],
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
