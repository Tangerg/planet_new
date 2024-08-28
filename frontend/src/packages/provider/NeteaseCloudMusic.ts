import Provider from "./provider";
import ky, {KyInstance} from 'ky';
import {Playlist,} from "../model/playlist";
import {Track, TrackPlayUrl} from "../model/track";
import {Artist} from "../model/artist";
import {Lyric, parseLyrics} from "../model/lyric";
import {Album} from "../model/album";
import {Personalized} from "../model/personalized";

export type Options = {
    host: string
}

export class NeteaseCloudMusic extends Provider {

    public static readonly NAME = "NeteaseCloudMusic";
    private readonly http: KyInstance

    constructor(opts: Options) {
        super();
        this.http = ky.create({
            prefixUrl: opts.host,
        })
    }

    get name(): string {
        return NeteaseCloudMusic.NAME
    }

    private resizeImage(url: string, size: number): string {
        return `${url}?param=${size}y${size}`
    }

    async playlistDetail(id: string): Promise<Playlist> {
        const res = await this.http.get("playlist/detail", {
            searchParams: {
                id: id
            }
        }).json<any>()

        const playlist: Partial<Playlist> = {
            id: res.playlist.id.toString(),
            name: res.playlist.name,
            image: this.resizeImage(res.playlist.coverImgUrl, 100),
            createTime: res.playlist.createTime,
            trackCount: res.playlist.trackCount,
            durationCount: 0,
            creator: {
                id: res.playlist.creator.userId.toString(),
                nickname: res.playlist.creator.nickname,
                image: this.resizeImage(res.playlist.creator.avatarUrl, 40)
            },
        }
        playlist.tracks = res.playlist.tracks.map((tr: any, index: number) => {
            const track: Partial<Track> = {
                index: index + 1,
                id: tr.id.toString(),
                name: tr.name,
                duration: tr.dt,
                album: {
                    id: tr.al.id.toString(),
                    name: tr.al.name,
                    image: this.resizeImage(tr.al.picUrl, 40)
                },
            }
            track.artists = tr.ar.map((ar: any): Partial<Artist> => {
                return {
                    id: ar.id.toString(),
                    name: ar.name,
                }
            })
            playlist.durationCount! += track.duration!
            return track
        })


        return playlist as Playlist
    }

    async lyric(id: string): Promise<Lyric[]> {
        const res = await this.http.get("lyric", {
            searchParams: {
                id: id
            }
        }).json<{
            lrc: {
                version: number,
                lyric: string
            }
        }>()

        return parseLyrics(res.lrc.lyric)
    }

    async albumDetail(id: string): Promise<Album> {
        const res = await this.http.get("album", {
            searchParams: {
                id: id
            }
        }).json<any>()

        const album: Partial<Album> = {
            id: res.album.id.toString(),
            name: res.album.name,
            alias: res.album.alias,
            image: res.album.picUrl,
            trackCount: res.album.size,
            durationCount: 0,
            publishTime: res.album.publishTime,
            artist: {
                id: res.album.artist.id.toString(),
                name: res.album.artist.name,
                image: res.album.artist.picUrl
            },
        }
        album.tracks = res.songs.map((tr: any, index: number) => {
            const track: Partial<Track> = {
                index: index + 1,
                id: tr.id.toString(),
                name: tr.name,
                duration: tr.dt,
            }
            track.artists = tr.ar.map((ar: any): Partial<Artist> => {
                return {
                    id: ar.id,
                    name: ar.name,
                }
            })
            album.durationCount! += track.duration!
            return track
        })
        console.log(album)
        return album as Album
    }

    async playUrls(ids: string[]): Promise<TrackPlayUrl[]> {
        const res = await this.http("song/url/v1", {
            searchParams: {
                level: "exhigh",
                id: ids.join(",")
            }
        }).json<any>()
        return res.data.map((tr: any): TrackPlayUrl => {
            return {
                id: tr.id.toString(),
                playUrl: tr.url,
            }
        })
    }

    async personalizedPlaylist(): Promise<Partial<Playlist>[]> {
        const res = await this.http.get("personalized").json<any>()
        return res.result.map((pl: any): Partial<Playlist> => {
            return {
                id: pl.id.toString(),
                name: pl.name,
                image: this.resizeImage(pl.picUrl, 200),
                trackCount: pl.trackCount,
            }
        })
    }

    async personalizedTracks(): Promise<Partial<Track>[]> {
        const res = await this.http.get("personalized/newsong").json<any>()
        return res.result.map((item: any): Partial<Track> => {
            const {song: tr} = item
            const track: Partial<Track> = {
                id: tr.id.toString(),
                name: tr.name,
                album: {
                    id: tr.album.id.toString(),
                    name: tr.album.name,
                    image: this.resizeImage(tr.album.picUrl, 100)
                }
            }
            track.artists = tr.artists.map((ar: any): Partial<Artist> => {
                return {
                    id: ar.id.toString(),
                    name: ar.name,
                }
            })
            return track
        })
    }

    async personalizedAlbums(): Promise<Partial<Album>[]> {
        const res = await this.http.get("album/newest").json<any>()
        return res.albums.map((al: any): Partial<Album> => {
            return {
                id: al.id.toString(),
                name: al.name,
                trackCount: al.size,
                image: this.resizeImage(al.picUrl, 200),
                artist: {
                    id: al.artist.id.toString(),
                    name: al.artist.name,
                }
            }
        })
    }

    async persionalizedArtists(): Promise<Partial<Artist>[]> {
        const res = await this.http.get("top/artists").json<any>()
        return res.artists.map((ar: any): Partial<Artist> => {
            return {
                id: ar.id.toString(),
                name: ar.name,
                image: this.resizeImage(ar.img1v1Url, 200),
                alias: ar.alias || [],
            }
        })
    }

    async personalized(): Promise<Personalized> {
        const res =
            await Promise.all([
                this.personalizedPlaylist(),
                this.personalizedAlbums(),
                this.persionalizedArtists(),
                this.personalizedTracks(),
            ])
        return {
            playlists: res[0].slice(0, 10),
            albums: res[1].slice(0, 10),
            artists: res[2].slice(0, 10),
            tracks: res[3].slice(0, 10),
        }
    }
}

export default NeteaseCloudMusic