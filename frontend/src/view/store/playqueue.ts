import { create } from "zustand";

import type {
  FormattedDuration,
  Progress,
} from "@kernel/model/duration";
import type { Track } from "@kernel/model/track";
import { PlayState } from "@kernel/plugin";

import { withSelectors } from "./selector";

/* -------------------------------------------------------------------------- */
/*  State / Action                                                              */
/* -------------------------------------------------------------------------- */

export interface PlayQueueState {
  /** 当前播放队列的 key（详情页路由生成，用于区分上下文） */
  key: string;
  /** 当前曲目列表（来自最近一次 change_play_queue） */
  tracks: readonly Track[];
  /** 正在播放的曲目 */
  track: Track | undefined;
  /** 播放状态机 */
  playState: PlayState;
  /** 当前曲目总时长 */
  duration: FormattedDuration;
  /** 当前播放进度 */
  progress: Progress;
}

export interface PlayQueueActions {
  setTracks: (tracks: readonly Track[]) => void;
  setTrack: (track: Track | undefined) => void;
  setPlayState: (s: PlayState) => void;
  setDuration: (d: FormattedDuration) => void;
  setProgress: (p: Progress) => void;
}

export type PlayQueueStore = PlayQueueState & PlayQueueActions;

const INITIAL_STATE: PlayQueueState = {
  key: "",
  tracks: [],
  track: undefined,
  playState: PlayState.STOPED,
  duration: { duration: 0, durationFormatted: "00:00" },
  progress: { duration: 0, durationFormatted: "00:00", percent: 0 },
};

/* -------------------------------------------------------------------------- */
/*  Store                                                                       */
/* -------------------------------------------------------------------------- */

const baseStore = create<PlayQueueStore>((set) => ({
  ...INITIAL_STATE,
  setTracks: (tracks) => set((s) => ({ ...s, tracks })),
  setTrack: (track) => set((s) => ({ ...s, track })),
  setPlayState: (playState) => set((s) => ({ ...s, playState })),
  setDuration: (duration) => set((s) => ({ ...s, duration })),
  setProgress: (progress) => set((s) => ({ ...s, progress })),
}));

export const usePlayQueueStore = withSelectors(baseStore);
