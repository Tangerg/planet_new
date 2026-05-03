import { Plugin } from "../core";
import { IProvider, ProviderCapability } from "./types";
import { Playlist } from "../model/playlist";
import { Lyric } from "../model/lyric";
import { Album } from "../model/album";
import { TrackPlayUrl } from "../model/track";
import { Personalized } from "../model/personalized";

/**
 * 数据源插件基类。所有具体的音乐数据源（NeteaseCloudMusic、Spotify、Mock 等）
 * 都通过继承 Provider 注册到 planet。整个系统同一时刻只挂载一个 provider，
 * 因此使用固定的插件 id（PLUGIN_ID）。具体 provider 用 `name` 和 `capabilities` 区分。
 */
abstract class Provider extends Plugin implements IProvider {
    public static readonly PLUGIN_ID = "provider";

    get id(): string {
        return Provider.PLUGIN_ID;
    }

    dispose(): void {
        // 默认无副作用，子类按需重写
    }

    abstract get name(): string

    abstract get capabilities(): ReadonlySet<ProviderCapability>

    supports(cap: ProviderCapability): boolean {
        return this.capabilities.has(cap);
    }

    abstract playlistDetail(id: string): Promise<Playlist>

    abstract lyric(id: string): Promise<Lyric[]>

    abstract albumDetail(id: string): Promise<Album>

    abstract playUrls(ids: string[]): Promise<TrackPlayUrl[]>

    abstract personalized(): Promise<Personalized>
}

export default Provider
