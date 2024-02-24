import {Track} from "../../model/track";
import {IEventMap} from "../types";

type EventPlayField = null
type EventAddTrackField = Track


export interface EventMap extends IEventMap {
    PLAY: EventPlayField
    ADDTRACK: EventAddTrackField
    ADDTRACK1: number
}
export default EventMap
