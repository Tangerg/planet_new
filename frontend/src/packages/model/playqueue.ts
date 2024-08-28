import {Track} from "./track";

export type PlayQueue = {
    key?: string;
    tracks?: Track[];
    track?: Track;
}