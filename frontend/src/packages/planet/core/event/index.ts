import {Track} from "../../model/track";
import {IEventMap} from "../types";


export interface EventMap extends IEventMap {
    PLAY: never
    ADDTRACK: Track
    ADDTRACK1: Track
}

export default EventMap
