import { definePlugin } from "dougong";
import {
  CURRENT_TRACK_CHANGED,
  DURATION_CHANGED,
  LYRICS_CHANGED,
  POSITION_CHANGED,
  PLAY_STATE_CHANGED,
  PROGRESS,
  QUEUE_CHANGED,
  REPEAT_CHANGED,
  SHUFFLE_CHANGED,
  VOLUME_CONTROL,
  VOLUME_CHANGED,
} from "@contexts/playback";

import { usePlayQueueStore } from "./playqueue";

/**
 * Pins kernel-dispatched facts into the zustand play-queue store, so any React
 * component mounted at any time reads current state without caring about
 * subscription timing. This is the kernel→UI boundary for playback state.
 *
 * Starting values are read from the Services that own them, not caught from a
 * fact: an Event is a transient statement that something changed, with no
 * replay and no dependable ordering against a sibling's setup. Volume in
 * particular is real state before anything changes it — the element already
 * carries a level — so the store would otherwise open on a default nobody chose.
 * Requiring those Services is also what puts this installation after them.
 */
export const playQueueStoreBridge = definePlugin({
  name: "planet.ui.play-queue-store-bridge",
  requires: { volume: VOLUME_CONTROL, progress: PROGRESS },
  setup(ctx) {
    usePlayQueueStore.setState((s) => ({
      ...s,
      volume: ctx.volume.level,
      duration: ctx.progress.duration,
      progress: ctx.progress.current,
    }));

    ctx.on(QUEUE_CHANGED, (tracks) => usePlayQueueStore.setState((s) => ({ ...s, tracks })));
    ctx.on(CURRENT_TRACK_CHANGED, (track) => usePlayQueueStore.setState((s) => ({ ...s, track })));
    ctx.on(PLAY_STATE_CHANGED, (playState) =>
      usePlayQueueStore.setState((s) => ({ ...s, playState })),
    );
    ctx.on(DURATION_CHANGED, (duration) => usePlayQueueStore.setState((s) => ({ ...s, duration })));
    // The progress plugin already throttles to ~1/sec at the source, so this is a plain pin.
    ctx.on(POSITION_CHANGED, (progress) => usePlayQueueStore.setState((s) => ({ ...s, progress })));
    ctx.on(LYRICS_CHANGED, (lyric) => usePlayQueueStore.setState((s) => ({ ...s, lyric })));
    ctx.on(SHUFFLE_CHANGED, (shuffle) => usePlayQueueStore.setState((s) => ({ ...s, shuffle })));
    ctx.on(REPEAT_CHANGED, (repeat) => usePlayQueueStore.setState((s) => ({ ...s, repeat })));
    ctx.on(VOLUME_CHANGED, (volume) => usePlayQueueStore.setState((s) => ({ ...s, volume })));
  },
});
