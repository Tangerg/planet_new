import { Plugin } from "@core";
import type { TrackSnapshot as Track } from "@contexts/catalog";
import type { FormattedDuration, Lyric, PlayState, Progress, RepeatMode } from "@contexts/playback";

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
    hooks.on("queue:shuffle-changed", this.onShuffleChanged, this);
    hooks.on("queue:repeat-changed", this.onRepeatChanged, this);
    hooks.on("volume:changed", this.onVolumeChanged, this);
  }

  protected onDispose(): void {
    const { hooks } = this.context;
    hooks.off("queue:changed", this.onPlayQueueChanged);
    hooks.off("queue:current-changed", this.onCurrentTrackChanged);
    hooks.off("playback:state-changed", this.onPlayStateChanged);
    hooks.off("progress:duration-changed", this.onDurationChanged);
    hooks.off("progress:position-changed", this.onProgressChanged);
    hooks.off("lyrics:changed", this.onLyricChanged);
    hooks.off("queue:shuffle-changed", this.onShuffleChanged);
    hooks.off("queue:repeat-changed", this.onRepeatChanged);
    hooks.off("volume:changed", this.onVolumeChanged);
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

  private onShuffleChanged(shuffle: boolean): void {
    usePlayQueueStore.setState((s) => ({ ...s, shuffle }));
  }

  private onRepeatChanged(repeat: RepeatMode): void {
    usePlayQueueStore.setState((s) => ({ ...s, repeat }));
  }

  // The Volume plugin seeds this during kernel init, before React mounts, which
  // is exactly why it belongs in the pinned store rather than a component's state.
  private onVolumeChanged(volume: number): void {
    usePlayQueueStore.setState((s) => ({ ...s, volume }));
  }
}
