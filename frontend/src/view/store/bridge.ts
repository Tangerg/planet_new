import { Plugin } from "@kernel/core";
import type {
  FormattedDuration,
  Progress,
} from "@kernel/model/duration";
import type { PlayQueue } from "@kernel/model/playqueue";
import type { Track } from "@kernel/model/track";
import type { PlayState } from "@kernel/plugin";

import { usePlayQueueStore } from "./playqueue";

/* -------------------------------------------------------------------------- */
/*  Kernel → UI 桥接                                                            */
/* -------------------------------------------------------------------------- */

/**
 * 把内核派发的事件固化进 zustand store，
 * 任何时刻 mount 的 React 组件都能直接读到当前态，而不必关心订阅时机。
 *
 * 桥接的事件：
 *   - play_queue_changed       → tracks
 *   - current_track_changed    → track
 *   - play_state_changed       → playState
 *   - track_duration_changed   → duration
 *   - play_time_changed        → progress
 */
export class StoreBridge extends Plugin {
  private static readonly ID = "store-bridge";

  get id(): string {
    return StoreBridge.ID;
  }

  protected onInit(): void {
    const { hooks } = this.context;
    hooks.on("play_queue_changed", this.onPlayQueueChanged, this);
    hooks.on("current_track_changed", this.onCurrentTrackChanged, this);
    hooks.on("play_state_changed", this.onPlayStateChanged, this);
    hooks.on("track_duration_changed", this.onDurationChanged, this);
    hooks.on("play_time_changed", this.onProgressChanged, this);
  }

  dispose(): void {
    const { hooks } = this.context;
    hooks.off("play_queue_changed", this.onPlayQueueChanged);
    hooks.off("current_track_changed", this.onCurrentTrackChanged);
    hooks.off("play_state_changed", this.onPlayStateChanged);
    hooks.off("track_duration_changed", this.onDurationChanged);
    hooks.off("play_time_changed", this.onProgressChanged);
  }

  private onPlayQueueChanged(queue: PlayQueue): void {
    usePlayQueueStore.setState((s) => ({ ...s, tracks: queue.tracks ?? [] }));
  }

  private onCurrentTrackChanged(track: Track): void {
    usePlayQueueStore.setState((s) => ({ ...s, track }));
  }

  private onPlayStateChanged(playState: PlayState): void {
    usePlayQueueStore.setState((s) => ({ ...s, playState }));
  }

  private onDurationChanged(duration: FormattedDuration): void {
    usePlayQueueStore.setState((s) => ({ ...s, duration }));
  }

  private onProgressChanged(progress: Progress): void {
    usePlayQueueStore.setState((s) => ({ ...s, progress }));
  }
}

export default StoreBridge;
