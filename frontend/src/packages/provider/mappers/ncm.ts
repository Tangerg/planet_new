import { Album } from "../../model/album";
import { Artist } from "../../model/artist";
import { Playlist } from "../../model/playlist";
import { Track } from "../../model/track";
import { User } from "../../model/user";

/**
 * NeteaseCloudMusic 字段 → 内部 model 的集中映射。
 * Provider 文件里只负责 HTTP，转换逻辑全部在这里。
 *
 * NCM 返回字段简写参考：
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
    return {
        id: raw.id?.toString() ?? "",
        name: raw.name,
        image: resizeImage(raw.img1v1Url, 200),
        alias: raw.alias ?? [],
    };
}

/** 简化版 album（嵌入在 track 里时使用） */
export function mapNcmAlbumStub(raw: any, imageSize = 40): Partial<Album> {
    return {
        id: raw.id?.toString() ?? "",
        name: raw.name,
        image: resizeImage(raw.picUrl, imageSize),
    };
}

export type MapTrackOptions = {
    /** 1-based 序号 */
    index?: number;
    /** 当 raw 没有 album 时用作 fallback（例如专辑详情页里曲目缺失 al 字段） */
    fallbackAlbum?: Partial<Album>;
    /** album 封面尺寸（NCM 通过 query 参数控制） */
    albumImageSize?: number;
};

/**
 * 把 NCM 返回的 track 节点（无论是 playlist 里的 `tr`，
 * 还是 album/songs 里的，还是 personalized/newsong 里的 `item.song`）
 * 统一转为内部 Track。
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
        duration: raw.dt ?? raw.duration ?? 0,
        album,
        artists: artistsRaw.map(mapNcmArtist),
    };
}

export function mapNcmCreator(raw: any): Partial<User> {
    return {
        id: raw.userId?.toString() ?? raw.id?.toString() ?? "",
        nickname: raw.nickname,
        image: resizeImage(raw.avatarUrl, 40),
    };
}

export function mapNcmPlaylist(raw: any): Playlist {
    const tracks = (raw.tracks ?? []).map((tr: any, i: number) =>
        mapNcmTrack(tr, { index: i + 1, albumImageSize: 40 }),
    );
    const durationCount = tracks.reduce(
        (acc: number, t: Partial<Track>) => acc + (t.duration ?? 0),
        0,
    );
    return {
        id: raw.id?.toString() ?? "",
        name: raw.name,
        description: raw.description ?? "",
        tags: raw.tags ?? [],
        image: resizeImage(raw.coverImgUrl, 100),
        createTime: raw.createTime ?? 0,
        trackCount: raw.trackCount ?? tracks.length,
        durationCount,
        creator: mapNcmCreator(raw.creator ?? {}),
        tracks: tracks as Partial<Track>[],
    } as Playlist;
}

export function mapNcmPlaylistStub(raw: any): Partial<Playlist> {
    return {
        id: raw.id?.toString() ?? "",
        name: raw.name,
        image: resizeImage(raw.picUrl, 200),
        trackCount: raw.trackCount,
    };
}

export function mapNcmAlbum(raw: any, songs: any[]): Album {
    const albumStub: Partial<Album> = {
        id: raw.id?.toString() ?? "",
        name: raw.name,
        image: raw.picUrl ?? "",
    };
    const tracks = songs.map((tr: any, i: number) =>
        mapNcmTrack(tr, { index: i + 1, fallbackAlbum: albumStub }),
    );
    const durationCount = tracks.reduce(
        (acc: number, t: Partial<Track>) => acc + (t.duration ?? 0),
        0,
    );
    return {
        id: raw.id?.toString() ?? "",
        name: raw.name,
        alias: raw.alias ?? [],
        image: raw.picUrl ?? "",
        trackCount: raw.size ?? tracks.length,
        durationCount,
        publishTime: raw.publishTime ?? 0,
        artist: raw.artist
            ? {
                  id: raw.artist.id?.toString() ?? "",
                  name: raw.artist.name,
                  image: raw.artist.picUrl ?? "",
              }
            : undefined,
        tracks: tracks as Partial<Track>[],
    } as Album;
}

export function mapNcmAlbumNewest(raw: any): Partial<Album> {
    return {
        id: raw.id?.toString() ?? "",
        name: raw.name,
        trackCount: raw.size,
        image: resizeImage(raw.picUrl, 200),
        artist: raw.artist
            ? {
                  id: raw.artist.id?.toString() ?? "",
                  name: raw.artist.name,
              }
            : undefined,
    };
}
