import {Artist} from "./artist";
import {Album} from "./album";
import {Duration} from "../shared-utils/time";

export type Track = {
    index?: number
    id: string
    name: string
    duration: Duration
    artists?: Partial<Artist>[]
    album?: Partial<Album>
    playUrl?: string
}

export type TrackPlayUrl = {
    id: string
    playUrl: string
}