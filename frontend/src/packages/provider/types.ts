import {Playlist} from "../model/playlist";
import {Lyric} from "../model/lyric";
import {Album} from "../model/album";
import {TrackPlayUrl} from "../model/track";
import {Personalized} from "../model/personalized";

/**
 * Provider 能力声明。每种数据源能做什么由 capabilities 集合表达，
 * UI 层据此决定是否显示歌词面板、是否提示"仅试听 30 秒"等。
 *
 * 不在能力集里时，对应方法应返回空值（lyric→[]、playUrls→[]），
 * 而非抛错，让调用方无须处处 if/try。
 */
export type ProviderCapability =
    | "playlistDetail"
    | "albumDetail"
    | "lyric"
    | "personalized"
    | "fullPlayback"      // 能给完整曲目可播放 URL
    | "previewPlayback"   // 仅 30s 试听片段（如 Spotify preview_url）

export interface IProvider {
    get name(): string

    /** 该 provider 支持的能力清单 */
    get capabilities(): ReadonlySet<ProviderCapability>

    supports(cap: ProviderCapability): boolean

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
     * 获取 home 数据
     */
    personalized(): Promise<Personalized>
}
