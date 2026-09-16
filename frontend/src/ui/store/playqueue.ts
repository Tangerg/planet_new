import { create } from "zustand";

import type { TrackSnapshot as Track } from "@contexts/catalog";
import {
  PlayState,
  RepeatMode,
  type FormattedDuration,
  type Lyric,
  type Progress,
} from "@contexts/playback";

import { withSelectors } from "./selector";

export interface PlayQueueState {
  tracks: readonly Track[];
  track: Track | undefined;
  playState: PlayState;
  duration: FormattedDuration;
  progress: Progress;
  lyric: readonly Lyric[];
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
}

export type PlayQueueStore = PlayQueueState;

const INITIAL_STATE: PlayQueueState = {
  tracks: [],
  track: undefined,
  playState: PlayState.STOPPED,
  duration: { duration: 0, durationFormatted: "00:00" },
  progress: { duration: 0, durationFormatted: "00:00", percent: 0 },
  lyric: [],
  shuffle: false,
  repeat: RepeatMode.OFF,
  volume: 0,
};

const baseStore = create<PlayQueueStore>(() => ({ ...INITIAL_STATE }));

export const usePlayQueueStore = withSelectors(baseStore);
