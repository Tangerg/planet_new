import {Track} from "./track";

export type PlayQueue = {
    key?: string;
    tracks?: readonly Track[];
    track?: Track;
}