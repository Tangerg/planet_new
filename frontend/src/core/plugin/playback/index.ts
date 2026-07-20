import { Plugin, defineCapability } from "../../kernel";
import type { Track } from "@domain/model/track";
import type { AudioOutputPort } from "@domain/ports/playback";
import { PROVIDER_REGISTRY } from "../provider-registry";
import { PLAY_QUEUE } from "../playqueue";

export enum PlayState {
  PLAYING = "playing",
  PAUSED = "paused",
  STOPPED = "stopped",
}

declare module "../../kernel/event" {
  interface PlanetEventMap {
    "playback:state-changed": PlayState;
    "playback:track-ended": never;
  }
}

/** Audio transport (resume/pause/stop). */
export const TRANSPORT = defineCapability<AudioOutputPort>("transport");

/**
 * Drives the shared <audio> element. Transport commands (resume/pause) arrive as
 * direct method calls from PlaybackService. It reacts to the internal
 * `queue:current-changed` fact by loading + playing the new track, and turns the
 * element's native `ended` into the `playback:track-ended` choreography event
 * the queue plugin auto-advances on.
 */
export class Playback extends Plugin implements AudioOutputPort {
  public static readonly id = "playback";
  /** Invalidates a pending audio.play() continuation after pause/stop/dispose. */
  private playGeneration = 0;
  /** Current track, kept so an `error` (expired stream URL) can re-resolve it. */
  private current: Track | undefined;
  /** Whether the current track's URL was already refreshed once after an error. */
  private recovered = false;

  get id(): string {
    return Playback.id;
  }

  protected onInit(): void {
    this.context.registry.provide(TRANSPORT, this);
    this.context.audioElement.addEventListener("ended", this.onEnded);
    this.context.audioElement.addEventListener("error", this.onError);
    this.context.hooks.on("queue:current-changed", this.onCurrentChanged, this);
  }

  protected onDispose(): void {
    this.stop();
    this.context.audioElement.removeEventListener("ended", this.onEnded);
    this.context.audioElement.removeEventListener("error", this.onError);
    this.context.hooks.off("queue:current-changed", this.onCurrentChanged);
  }

  async resume(): Promise<void> {
    const context = this.context;
    const audio = context.audioElement;
    const generation = ++this.playGeneration;
    if (!audio.src) {
      context.hooks.emit("playback:state-changed", PlayState.STOPPED);
      return;
    }
    try {
      await audio.play();
      if (generation !== this.playGeneration) return;
      context.hooks.emit("playback:state-changed", PlayState.PLAYING);
    } catch {
      if (generation !== this.playGeneration) return;
      context.hooks.emit("playback:state-changed", PlayState.STOPPED);
    }
  }

  pause(): void {
    this.playGeneration += 1;
    this.context.audioElement.pause();
    this.context.hooks.emit("playback:state-changed", PlayState.PAUSED);
  }

  stop(): void {
    this.playGeneration += 1;
    this.context.audioElement.pause();
    this.context.audioElement.src = "";
    this.context.hooks.emit("playback:state-changed", PlayState.STOPPED);
  }

  private onEnded = (): void => {
    this.context.hooks.emit("playback:state-changed", PlayState.STOPPED);
    this.context.hooks.emit("playback:track-ended");
  };

  private onCurrentChanged = (track: Track | undefined): void => {
    this.current = track;
    this.recovered = false;
    // No playable URL (cleared queue, mock provider, or a Spotify track with no
    // preview): stop and bail — the track metadata was already broadcast.
    if (!track?.playUrl) {
      this.stop();
      return;
    }

    this.context.audioElement.src = track.playUrl;
    void this.resume();
  };

  // Provider stream URLs are short-lived, and the whole queue is resolved up front,
  // so a track reached late in a long session can load with an expired URL and fire
  // an `error`. Re-resolve THIS track once and reload; if the fresh URL also fails
  // (or there's nothing to resolve), skip to the next track rather than dead-end the
  // queue. The analysis probe is deliberately untouched.
  private onError = (): void => {
    // Ignore the empty-source `error` from stop()'s reset — only a real loaded
    // source that failed should recover.
    if (!this.context.audioElement.currentSrc) return;
    void this.recoverOrSkip();
  };

  private async recoverOrSkip(): Promise<void> {
    const track = this.current;
    if (!track?.playbackId || this.recovered) {
      this.skipToNext();
      return;
    }
    this.recovered = true;
    const url = await this.resolveFreshUrl(track);
    if (this.current !== track) return; // a newer track superseded the recovery
    if (!url) {
      this.skipToNext();
      return;
    }
    this.context.audioElement.src = url;
    void this.resume();
  }

  private skipToNext(): void {
    this.context.registry.resolve(PLAY_QUEUE)?.next();
  }

  /** Ask the track's own provider for a fresh stream URL (its old one expired). */
  private async resolveFreshUrl(track: Track): Promise<string | undefined> {
    const resolver = this.context.registry
      .resolve(PROVIDER_REGISTRY)
      ?.get(track.providerId)?.playback;
    if (!resolver || !track.playbackId) return undefined;
    try {
      const urls = await resolver.resolve([track.playbackId]);
      return urls.find((entry) => entry.playbackId === track.playbackId)?.playUrl;
    } catch {
      return undefined;
    }
  }
}
