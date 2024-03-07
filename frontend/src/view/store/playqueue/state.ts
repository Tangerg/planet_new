import {Track} from "../../../packages/planet/model/track";

export interface State {
    currentTrack: Track | null
    tracks: Array<Track>
}

export const initState: State = {
    currentTrack: null,
    tracks: []
}
