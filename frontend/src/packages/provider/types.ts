import {Playlist} from "../model/playlist";
import {Lyric} from "../model/lyric";
import {Album} from "../model/album";
import {TrackPlayUrl} from "../model/track";
import {Personalized} from "../model/personalized";

export interface IProvider {
    get name(): string

    /**
     * 获取歌单详情
     * @param id 歌单id
     */
    playlistDetail(id: string): Promise<Playlist>

    /**
     * 获取歌曲歌词
     * @param id 歌曲id
     */
    lyric(id: string): Promise<Lyric[]>

    /**
     * 获取专辑详情
     * @param id 专辑id
     */
    albumDetail(id: string): Promise<Album>

    /**
     * 获取歌曲播放地址
     * @param ids 歌曲ids
     */
    playUrls(ids: string[]): Promise<TrackPlayUrl[]>

    /**
     * 获取hone数据
     */
    personalized(): Promise<Personalized>
}