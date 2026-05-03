import { create } from "zustand";
import { initState, State } from "./state";
import createSelectors from "../shared-utils/selector";
import { Track } from "../../../packages/model/track";
import { PlayState } from "../../../packages/plugin";
import type {
    FormattedDuration,
    Progress,
} from "../../../packages/model/duration";

export interface Action {
    setTracks: (tracks: readonly Track[]) => void;
    setTrack: (track: Track | undefined) => void;
    setPlayState: (s: PlayState) => void;
    setDuration: (d: FormattedDuration) => void;
    setProgress: (p: Progress) => void;
}

export type Store = State & Action;

const _useStore = create<Store>((set) => ({
    ...initState,
    setTracks: (tracks) => set((state) => ({ ...state, tracks })),
    setTrack: (track) => set((state) => ({ ...state, track })),
    setPlayState: (playState) => set((state) => ({ ...state, playState })),
    setDuration: (duration) => set((state) => ({ ...state, duration })),
    setProgress: (progress) => set((state) => ({ ...state, progress })),
}));

export const useStore = createSelectors(_useStore);
