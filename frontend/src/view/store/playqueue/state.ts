import {Track} from "../../../packages/model/track";

export interface State {
    key: string
    tracks: Track[]
    track: Track | undefined
}

export const initState: State = {
    key: "",
    tracks: [],
    track: undefined,
}
