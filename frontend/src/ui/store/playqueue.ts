import { create } from "zustand";

import type { FormattedDuration, Progress } from "@domain/model/duration";
import type { Track } from "@domain/model/track";
import { PlayState } from "@core/plugin";

import { withSelectors } from "./selector";

/* -------------------------------------------------------------------------- */
/*  State / Action                                                              */
/* -------------------------------------------------------------------------- */

export interface PlayQueueState {
  /** Current play-queue key (per playback context; distinguishes one queue from another). */
  key: string;
  /** Current track list (from the latest change_play_queue). */
  tracks: readonly Track[];
  /** The currently playing track. */
  track: Track | undefined;
  /** Play state. */
  playState: PlayState;
  /** Total duration of the current track. */
  duration: FormattedDuration;
  /** Current playback progress. */
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
  playState: PlayState.STOPPED,
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
