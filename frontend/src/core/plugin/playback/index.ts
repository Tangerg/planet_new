import { Plugin, defineCapability } from "../../kernel";
import { Track } from "@domain/model/track";
import { PlaybackAvailability } from "@domain/model/playback-availability";
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
    /** The current track carrying a FRESHLY resolved play URL — for consumers
     *  that need the audible source (the analysis probe). Undefined when nothing
     *  playable is loaded. Distinct from `queue:current-changed`, which is the
     *  (unresolved) identity fact the UI renders. */
    "playback:current-resolved": Track | undefined;
  }
}

/** Audio transport (resume/pause/stop). */
export const TRANSPORT = defineCapability<AudioOutputPort>("transport");

// Consecutive unplayable tracks to skip before giving up. Guards against a queue
// whose URLs are all dead — or a repeat-all queue of unavailable tracks — spinning
// forever instead of settling.
const MAX_CONSECUTIVE_SKIPS = 20;

/**
 * Drives the shared <audio> element. Transport commands (resume/pause) arrive as
 * direct method calls from PlaybackService. It reacts to the internal
 * `queue:current-changed` fact by resolving that track's play URL JUST IN TIME
 * and playing it — provider stream URLs are short-lived, so resolving the whole
 * queue up front would leave later tracks with expired URLs. A newer current
 * supersedes a slow resolve via `loadGeneration`. A track that resolves to no URL,
 * or whose media errors, is skipped to the next rather than dead-ending the queue.
 */
export class Playback extends Plugin implements AudioOutputPort {
  public static readonly id = "playback";
  /** Invalidates a pending audio.play() continuation after pause/stop/dispose. */
  private playGeneration = 0;
  /** Invalidates a pending URL resolution when the current track changes again. */
  private loadGeneration = 0;
  /** Consecutive skip count, reset on any track that plays. */
  private skips = 0;

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
    this.loadGeneration += 1;
    this.context.audioElement.pause();
    this.context.audioElement.src = "";
    this.context.hooks.emit("playback:state-changed", PlayState.STOPPED);
  }

  private onEnded = (): void => {
    this.context.hooks.emit("playback:state-changed", PlayState.STOPPED);
    this.context.hooks.emit("playback:track-ended");
  };

  private onError = (): void => {
    // Ignore the empty-source reset done by stop(); only a real loaded source that
    // errored (dead / expired URL, network, decode) should skip to the next track.
    if (!this.context.audioElement.currentSrc) return;
    this.skipUnplayable();
  };

  private onCurrentChanged = async (track: Track | undefined): Promise<void> => {
    const generation = ++this.loadGeneration;
    if (!track) {
      this.stop();
      this.context.hooks.emit("playback:current-resolved", undefined);
      return;
    }
    const url = await this.resolvePlayUrl(track);
    // A newer current-changed superseded this resolve — drop the stale result.
    if (generation !== this.loadGeneration) return;
    if (!url) {
      this.skipUnplayable();
      return;
    }
    this.skips = 0;
    this.context.audioElement.src = url;
    // Broadcast the freshly-resolved track for the analysis probe. The QUEUE keeps
    // the unresolved track, so the next time it plays it resolves a fresh URL again.
    this.context.hooks.emit("playback:current-resolved", { ...track, playUrl: url });
    void this.resume();
  };

  /**
   * Resolve a fresh play URL for one track. Provider full-stream URLs are resolved
   * on demand (they expire); already-playable sources — local files, previews —
   * carry their URL on the track and need no round-trip.
   */
  private async resolvePlayUrl(track: Track): Promise<string | undefined> {
    const resolver = this.context.registry
      .resolve(PROVIDER_REGISTRY)
      ?.get(track.providerId)?.playback;
    if (
      !PlaybackAvailability.requiresFullUrlResolution(
        Track.playbackAvailability(track, resolver?.policy),
      )
    ) {
      return track.playUrl ?? track.previewUrl;
    }
    if (!resolver || !track.playbackId) return undefined;
    try {
      const urls = await resolver.resolve([track.playbackId]);
      return urls.find((entry) => entry.playbackId === track.playbackId)?.playUrl;
    } catch {
      return undefined;
    }
  }

  private skipUnplayable(): void {
    if (this.skips >= MAX_CONSECUTIVE_SKIPS) {
      this.skips = 0;
      this.stop();
      this.context.hooks.emit("playback:current-resolved", undefined);
      return;
    }
    this.skips += 1;
    // Advance to the next track (an explicit skip, so repeat-one does not replay the
    // failing one). The queue settles on its own at the end with repeat off.
    this.context.registry.resolve(PLAY_QUEUE)?.next();
  }
}
