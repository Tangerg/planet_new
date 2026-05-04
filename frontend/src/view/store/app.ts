import { create } from "zustand";

import { withSelectors } from "./selector";

/* -------------------------------------------------------------------------- */
/*  应用级 UI 态                                                                 */
/* -------------------------------------------------------------------------- */

export interface AppState {
  /** Queue 抽屉是否展开 */
  isQueueOpen: boolean;
  /** 全屏播放页是否展开 */
  isNowPlayingOpen: boolean;
  /** 当前页的封面图 URL，basic 布局根级 CoverAmbientBg 据此染色全窗 */
  coverImage: string | undefined;
}

export interface AppActions {
  setIsQueueOpen: (v: boolean) => void;
  setIsNowPlayingOpen: (v: boolean) => void;
  setCoverImage: (image: string | undefined) => void;
}

export type AppStore = AppState & AppActions;

const INITIAL_STATE: AppState = {
  isQueueOpen: false,
  isNowPlayingOpen: false,
  coverImage: undefined,
};

const baseStore = create<AppStore>((set) => ({
  ...INITIAL_STATE,
  setIsQueueOpen: (isQueueOpen) => set((s) => ({ ...s, isQueueOpen })),
  setIsNowPlayingOpen: (isNowPlayingOpen) =>
    set((s) => ({ ...s, isNowPlayingOpen })),
  setCoverImage: (coverImage) => set((s) => ({ ...s, coverImage })),
}));

export const useAppStore = withSelectors(baseStore);
export default useAppStore;

/* -------------------------------------------------------------------------- */
/*  常用复合 selector                                                            */
/* -------------------------------------------------------------------------- */

export const queueOpenSelector = (
  state: AppStore,
): [boolean, (v: boolean) => void] => [state.isQueueOpen, state.setIsQueueOpen];

export const nowPlayingOpenSelector = (
  state: AppStore,
): [boolean, (v: boolean) => void] => [
  state.isNowPlayingOpen,
  state.setIsNowPlayingOpen,
];
