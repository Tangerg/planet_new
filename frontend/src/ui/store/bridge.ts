import { definePlugin } from "dougong";
import {
  CURRENT_TRACK_CHANGED,
  DURATION_CHANGED,
  LYRICS_CHANGED,
  POSITION_CHANGED,
  PLAY_STATE_CHANGED,
  QUEUE_CHANGED,
  REPEAT_CHANGED,
  SHUFFLE_CHANGED,
  VOLUME_CHANGED,
} from "@contexts/playback";

import { usePlayQueueStore } from "./playqueue";

/**
 * Pins kernel-dispatched facts into the zustand play-queue store, so any React
 * component mounted at any time reads current state without caring about
 * subscription timing. This is the kernel→UI boundary for playback state.
 *
 * It declares no requirements on purpose. That puts it in the first startup
 * layer, so its listeners are published before any plugin that needs the audio
 * runtime can announce its seed — the volume level the element already carries
 * would otherwise be broadcast into an empty room, leaving the UI on a made-up
 * default.
 */
export const playQueueStoreBridge = definePlugin({
  name: "planet.ui.play-queue-store-bridge",
  setup(ctx) {
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
