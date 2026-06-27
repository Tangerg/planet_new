import { Plugin } from "@core";
import type { FormattedDuration, Progress } from "@domain/model/duration";
import type { PlayQueue } from "@domain/model/playqueue";
import type { Track } from "@domain/model/track";
import type { Lyric } from "@domain/model/lyric";
import type { PlayState } from "@core/plugin";

import { usePlayQueueStore } from "./playqueue";

/**
 * Pins kernel-dispatched events into the zustand play-queue store, so any React
 * component mounted at any time reads current state without caring about
 * subscription timing. This is the kernel→UI boundary for playback state.
 */
export class PlayQueueStoreBridge extends Plugin {
  private static readonly ID = "play-queue-store-bridge";

  get id(): string {
    return PlayQueueStoreBridge.ID;
  }

  protected onInit(): void {
    const { hooks } = this.context;
    hooks.on("play_queue_changed", this.onPlayQueueChanged, this);
    hooks.on("current_track_changed", this.onCurrentTrackChanged, this);
    hooks.on("play_state_changed", this.onPlayStateChanged, this);
    hooks.on("track_duration_changed", this.onDurationChanged, this);
    hooks.on("play_time_changed", this.onProgressChanged, this);
    hooks.on("lyric_changed", this.onLyricChanged, this);
  }

  protected onDispose(): void {
    const { hooks } = this.context;
    hooks.off("play_queue_changed", this.onPlayQueueChanged);
    hooks.off("current_track_changed", this.onCurrentTrackChanged);
    hooks.off("play_state_changed", this.onPlayStateChanged);
    hooks.off("track_duration_changed", this.onDurationChanged);
    hooks.off("play_time_changed", this.onProgressChanged);
    hooks.off("lyric_changed", this.onLyricChanged);
  }

  private onPlayQueueChanged(queue: PlayQueue): void {
    usePlayQueueStore.setState((s) => ({ ...s, tracks: queue.tracks ?? [] }));
  }

  private onCurrentTrackChanged(track: Track): void {
    usePlayQueueStore.setState((s) => ({ ...s, track }));
  }

  private onLyricChanged(lyric: Lyric[]): void {
    usePlayQueueStore.setState((s) => ({ ...s, lyric }));
  }

  private onPlayStateChanged(playState: PlayState): void {
    usePlayQueueStore.setState((s) => ({ ...s, playState }));
  }

  private onDurationChanged(duration: FormattedDuration): void {
    usePlayQueueStore.setState((s) => ({ ...s, duration }));
  }

  private lastProgressSecond = -1;
  private onProgressChanged(progress: Progress): void {
    const sec = Math.floor(progress.duration);
    if (sec === this.lastProgressSecond) return;
    this.lastProgressSecond = sec;
    usePlayQueueStore.setState((s) => ({ ...s, progress }));
  }
}
