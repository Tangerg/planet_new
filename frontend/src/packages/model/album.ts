import {Artist} from "./artist";
import {Duration} from "../shared-utils/time";
import {Track} from "./track";

export type Album = {
    id: string
    name: string
    alias: string[]
    image: string
    trackCount: number
    publishTime: number
    durationCount: Duration
    tracks?: Partial<Track>[]
    artist?: Partial<Artist>
    artists?: Partial<Artist>[]
}
