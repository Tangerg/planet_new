import ky, { KyInstance } from "ky";

import Provider from "./provider";
import { ProviderCapability } from "./types";
import { Playlist } from "../model/playlist";
import { Track, TrackPlayUrl } from "../model/track";
import { Artist } from "../model/artist";
import { Lyric, parseLyrics } from "../model/lyric";
import { Album } from "../model/album";
import { Personalized } from "../model/personalized";
import {
    mapNcmAlbum,
    mapNcmAlbumNewest,
    mapNcmFeaturedArtist,
    mapNcmPlaylist,
    mapNcmPlaylistStub,
    mapNcmTrack,
} from "./mappers/ncm";

export type Options = {
    host: string
}

export class NeteaseCloudMusic extends Provider {

    public static readonly NAME = "NeteaseCloudMusic";
    private static readonly CAPABILITIES: ReadonlySet<ProviderCapability> =
        new Set<ProviderCapability>([
            "playlistDetail",
            "albumDetail",
            "artistDetail",
            "lyric",
            "personalized",
            "fullPlayback",
        ]);

    private readonly http: KyInstance

    constructor(opts: Options) {
        super();
        this.http = ky.create({
            prefix: opts.host,
        })
    }

    get name(): string {
        return NeteaseCloudMusic.NAME
    }

    get capabilities(): ReadonlySet<ProviderCapability> {
        return NeteaseCloudMusic.CAPABILITIES;
    }

    async playlistDetail(id: string): Promise<Playlist> {
        const res = await this.http.get("playlist/detail", {
            searchParams: { id },
        }).json<{ playlist: any }>()
        return mapNcmPlaylist(res.playlist)
    }

    async lyric(id: string): Promise<Lyric[]> {
        const res = await this.http.get("lyric", {
            searchParams: { id },
        }).json<{ lrc: { version: number; lyric: string } }>()
        return parseLyrics(res.lrc.lyric)
    }

    async albumDetail(id: string): Promise<Album> {
        const res = await this.http.get("album", {
            searchParams: { id },
        }).json<{ album: any; songs: any[] }>()
        return mapNcmAlbum(res.album, res.songs ?? [])
    }

    async artistDetail(id: string): Promise<Artist> {
        type ArtistInfoRes = { artist: any; hotSongs: any[] }
        type ArtistDescRes = {
            briefDesc?: string
            introduction?: { ti?: string; txt?: string }[]
        }
        // /artists 一次返回 artist 信息 + hotSongs；bio 走 /artist/desc
        const [info, desc] = await Promise.all([
            this.http
                .get("artists", { searchParams: { id } })
                .json<ArtistInfoRes>()
                .catch(() => ({ artist: {}, hotSongs: [] }) as ArtistInfoRes),
            this.http
                .get("artist/desc", { searchParams: { id } })
                .json<ArtistDescRes>()
                .catch(() => ({}) as ArtistDescRes),
        ])

        const artist = info.artist ?? {}
        const topTracks = (info.hotSongs ?? []).slice(0, 10).map((s, i) =>
            mapNcmTrack(s, { index: i + 1 }),
        )
        const description =
            desc.briefDesc ||
            desc.introduction?.[0]?.txt ||
            ""
        return {
            id: artist.id?.toString() ?? id,
            name: artist.name ?? "",
            image: artist.cover ?? artist.picUrl ?? "",
            banner: artist.cover ?? "",
            alias: artist.alias ?? [],
            description,
            topTracks,
        }
    }

    async playUrls(ids: string[]): Promise<TrackPlayUrl[]> {
        if (ids.length === 0) return []
        const res = await this.http.get("song/url/v1", {
            searchParams: {
                level: "exhigh",
                id: ids.join(","),
            },
        }).json<{ data: Array<{ id: number | string; url: string | null }> }>()
        return res.data
            .filter((tr) => !!tr.url)
            .map((tr): TrackPlayUrl => ({
                id: tr.id.toString(),
                playUrl: tr.url as string,
            }))
    }

    private async personalizedPlaylist(): Promise<Partial<Playlist>[]> {
        const res = await this.http.get("personalized").json<{ result: any[] }>()
        return res.result.map(mapNcmPlaylistStub)
    }

    private async personalizedTracks(): Promise<Partial<Track>[]> {
        const res = await this.http.get("personalized/newsong")
            .json<{ result: Array<{ song: any }> }>()
        return res.result.map((item) =>
            mapNcmTrack(item.song, { albumImageSize: 100 }),
        )
    }

    private async personalizedAlbums(): Promise<Partial<Album>[]> {
        const res = await this.http.get("album/newest").json<{ albums: any[] }>()
        return res.albums.map(mapNcmAlbumNewest)
    }

    private async personalizedArtists(): Promise<Partial<Artist>[]> {
        const res = await this.http.get("top/artists").json<{ artists: any[] }>()
        return res.artists.map(mapNcmFeaturedArtist)
    }

    async personalized(): Promise<Personalized> {
        const [playlists, albums, artists, tracks] = await Promise.all([
            this.personalizedPlaylist(),
            this.personalizedAlbums(),
            this.personalizedArtists(),
            this.personalizedTracks(),
        ])
        return {
            playlists: playlists.slice(0, 10),
            albums: albums.slice(0, 10),
            artists: artists.slice(0, 10),
            tracks: tracks.slice(0, 10),
        }
    }
}

export default NeteaseCloudMusic
