import {Track} from "./track";
import {Duration} from "../shared-utils/time";
import {User} from "./user";

export type Playlist = {
    id: string
    name: string
    description: string
    tags: string[]
    image: string
    tracks: Track[]
    createTime: Duration
    creator: User
    trackCount: number
}