import {create} from "zustand";
import {initState, State} from "./state";
import {Track} from "../../../packages/planet/model/track";
import {createStoreWithSelectors} from "../shared-utils/selector";

export interface Action {
    changeCurrentTrack: (t: Track) => void
    changeTracks: (ts: Track[]) => void
}

export type Store = State & Action

const _useStore = create<Store>((set, get) => ({
    ...initState,
    changeCurrentTrack: (t: Track): void => {
        set((store) => ({
            ...store,
            currentTrack: t
        }))
    },
    changeTracks: (ts: Track[]): void => {
        set((store) => ({
            ...store,
            tracks: ts
        }))
    }
}))

export const useStore = createStoreWithSelectors(_useStore)
