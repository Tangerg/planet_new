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

/* -------------------------------------------------------------------------- */
/*  State / Action                                                              */
/* -------------------------------------------------------------------------- */

export interface PlayQueueState {
  /** Current track list (from the latest queue:changed). */
  tracks: readonly Track[];
  /** The currently playing track. */
  track: Track | undefined;
  /** Play state. */
  playState: PlayState;
  /** Total duration of the current track. */
  duration: FormattedDuration;
  /** Current playback progress. */
  progress: Progress;
  /** Lyrics of the current track (kernel-owned, via the Lyric plugin). */
  lyric: readonly Lyric[];
  /** Shuffle mode, owned by the play-queue aggregate. */
  shuffle: boolean;
  /** Repeat mode, owned by the play-queue aggregate. */
  repeat: RepeatMode;
  /** Output level 0..100, owned by the Volume value object. */
  volume: number;
}

/**
 * The store is written by `playQueueStoreBridge` only — it is a pinned
 * projection of kernel events, not a place the UI mutates. So there are no
 * setter actions on it; commands go through PlaybackService.
 */
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

/* -------------------------------------------------------------------------- */
/*  Store                                                                       */
/* -------------------------------------------------------------------------- */

const baseStore = create<PlayQueueStore>(() => ({ ...INITIAL_STATE }));

export const usePlayQueueStore = withSelectors(baseStore);
