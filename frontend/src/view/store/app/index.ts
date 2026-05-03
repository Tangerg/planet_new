import { create } from "zustand";
import createSelectors from "../shared-utils/selector";

type State = {
    isQueueOpen: boolean;
    isNowPlayingOpen: boolean;
    /** 当前页的封面 URL，用于全局氛围色背景；home 等无明确封面的页面应设为 undefined */
    coverImage: string | undefined;
};
type Action = {
    setIsQueueOpen: (isQueueOpen: boolean) => void;
    setIsNowPlayingOpen: (isNowPlayingOpen: boolean) => void;
    setCoverImage: (image: string | undefined) => void;
};
type Store = State & Action;

const initialState: State = {
    isQueueOpen: false,
    isNowPlayingOpen: false,
    coverImage: undefined,
};

const useStore = create<Store>((set) => ({
    ...initialState,
    setIsQueueOpen: (isQueueOpen) =>
        set((state) => ({ ...state, isQueueOpen })),
    setIsNowPlayingOpen: (isNowPlayingOpen) =>
        set((state) => ({ ...state, isNowPlayingOpen })),
    setCoverImage: (coverImage) =>
        set((state) => ({ ...state, coverImage })),
}));

const useAppStore = createSelectors(useStore);
export default useAppStore;

export const queueOpenSelector = (
    state: Store,
): [boolean, (v: boolean) => void] => [state.isQueueOpen, state.setIsQueueOpen];

export const nowPlayingOpenSelector = (
    state: Store,
): [boolean, (v: boolean) => void] => [
    state.isNowPlayingOpen,
    state.setIsNowPlayingOpen,
];
