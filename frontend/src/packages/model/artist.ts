import type { Track } from "./track";

export type Artist = {
    id: string
    name: string
    alias?: string[]
    image: string
    /** 简介（部分 provider 提供） */
    description?: string
    /** 大图横版 banner（部分 provider 提供） */
    banner?: string
    /** 月度听众数 / 粉丝数（仅 Spotify 与部分接口有） */
    followers?: number
    /** 流派标签 */
    genres?: string[]
    /** 热门曲目（artistDetail 接口填充） */
    topTracks?: Partial<Track>[]
}
