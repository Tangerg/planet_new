import {create} from "zustand";
import {initState, State} from "./state";
import createSelectors from "../shared-utils/selector";
import {Track} from "../../../packages/model/track";


export interface Action {
    setTracks: (tracks: Track[]) => void;
    setTrack: (track: Track) => void;
}

export type Store = State & Action

const _useStore = create<Store>((set) => ({
    ...initState,
    setTracks: (tracks: Track[]) => set(state => ({...state, tracks: tracks})),
    setTrack: (track: Track) => set(state => ({...state, track: track})),
}))

export const useStore = createSelectors(_useStore)