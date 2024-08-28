import {Track} from "./track";
import {Duration} from "../shared-utils/time";
import {User} from "./user";

export type Playlist = {
    id: string
    name: string
    description: string
    tags: string[]
    image: string
    tracks: Partial<Track>[]
    createTime: Duration
    creator: Partial<User>
    trackCount: number
    durationCount: Duration
}