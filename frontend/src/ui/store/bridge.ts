import { Plugin } from "@core";
import type { FormattedDuration, Progress } from "@domain/model/duration";
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
    hooks.on("queue:changed", this.onPlayQueueChanged, this);
    hooks.on("queue:current-changed", this.onCurrentTrackChanged, this);
    hooks.on("playback:state-changed", this.onPlayStateChanged, this);
    hooks.on("progress:duration-changed", this.onDurationChanged, this);
    hooks.on("progress:position-changed", this.onProgressChanged, this);
    hooks.on("lyrics:changed", this.onLyricChanged, this);
  }

  protected onDispose(): void {
    const { hooks } = this.context;
    hooks.off("queue:changed", this.onPlayQueueChanged);
    hooks.off("queue:current-changed", this.onCurrentTrackChanged);
    hooks.off("playback:state-changed", this.onPlayStateChanged);
    hooks.off("progress:duration-changed", this.onDurationChanged);
    hooks.off("progress:position-changed", this.onProgressChanged);
    hooks.off("lyrics:changed", this.onLyricChanged);
  }

  private onPlayQueueChanged(tracks: readonly Track[]): void {
    usePlayQueueStore.setState((s) => ({ ...s, tracks }));
  }

  private onCurrentTrackChanged(track: Track | undefined): void {
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

  // The Progress plugin already throttles to ~1/sec at the source, so this is a plain pin.
  private onProgressChanged(progress: Progress): void {
    usePlayQueueStore.setState((s) => ({ ...s, progress }));
  }
}
