import { definePlugin, service } from "dougong";
import type { Track } from "@domain/model/track";
import { PlayState } from "@domain/model/play-state";
import type { AudioOutputPort } from "@domain/ports/playback";
import {
  AUDIO_RUNTIME,
  broadcaster,
  CURRENT_TRACK_CHANGED,
  PLAY_STATE_CHANGED,
  TRACK_ENDED,
  type Broadcast,
} from "../../kernel";
import { PROVIDER_REGISTRY, type ProviderRegistryPort } from "../provider-registry";
import { PLAY_QUEUE, type PlayQueueRuntime } from "../playqueue";

/** Audio transport (resume/pause/stop). */
export const TRANSPORT = service<AudioOutputPort>("planet/transport");

type TransportDeps = {
  readonly audioElement: HTMLAudioElement;
  readonly providers: ProviderRegistryPort;
  readonly queue: PlayQueueRuntime;
  readonly broadcast: Broadcast;
};

/**
 * Drives the shared <audio> element. Transport commands (resume/pause) arrive as
 * direct method calls from PlaybackService. It reacts to the current-track fact
 * by loading + playing the new track, and turns the element's native `ended`
 * into the `TRACK_ENDED` choreography fact the queue auto-advances on.
 */
export class AudioPlaybackAdapter implements AudioOutputPort {
  /** Invalidates a pending audio.play() continuation after pause/stop/release. */
  private playGeneration = 0;
  /** Current track, kept so an `error` (expired stream URL) can re-resolve it. */
  private current: Track | undefined;
  /** Whether the current track's URL was already refreshed once after an error. */
  private recovered = false;

  constructor(private readonly deps: TransportDeps) {
    this.deps.audioElement.addEventListener("ended", this.onEnded);
    this.deps.audioElement.addEventListener("error", this.onError);
  }

  async resume(): Promise<void> {
    const audio = this.deps.audioElement;
    const generation = ++this.playGeneration;
    if (!audio.src) {
      this.deps.broadcast(PLAY_STATE_CHANGED, PlayState.STOPPED);
      return;
    }
    try {
      await audio.play();
      if (generation !== this.playGeneration) return;
      this.deps.broadcast(PLAY_STATE_CHANGED, PlayState.PLAYING);
    } catch {
      if (generation !== this.playGeneration) return;
      this.deps.broadcast(PLAY_STATE_CHANGED, PlayState.STOPPED);
    }
  }

  pause(): void {
    this.playGeneration += 1;
    this.deps.audioElement.pause();
    this.deps.broadcast(PLAY_STATE_CHANGED, PlayState.PAUSED);
  }

  stop(): void {
    this.halt();
    this.deps.broadcast(PLAY_STATE_CHANGED, PlayState.STOPPED);
  }

  /** Load and start whatever the queue just made current. */
  readonly onCurrentChanged = (track: Track | undefined): void => {
    this.current = track;
    this.recovered = false;
    // No playable URL (cleared queue, a source with no playback port, or a
    // Spotify track with no preview): stop and bail — the metadata already went out.
    if (!track?.playUrl) {
      this.stop();
      return;
    }

    this.deps.audioElement.src = track.playUrl;
    void this.resume();
  };

  /**
   * Symmetric teardown for what the constructor attached. It halts the element
   * without announcing a stop: the graph is being torn down, so there is no
   * listener left that the transport state could still be news to.
   */
  release(): void {
    this.halt();
    this.deps.audioElement.removeEventListener("ended", this.onEnded);
    this.deps.audioElement.removeEventListener("error", this.onError);
  }

  /** Silence the element and invalidate any pending play() continuation. */
  private halt(): void {
    this.playGeneration += 1;
    this.deps.audioElement.pause();
    this.deps.audioElement.src = "";
  }

  private onEnded = (): void => {
    this.deps.broadcast(PLAY_STATE_CHANGED, PlayState.STOPPED);
    this.deps.broadcast(TRACK_ENDED);
  };

  // Provider stream URLs are short-lived, and the whole queue is resolved up front,
  // so a track reached late in a long session can load with an expired URL and fire
  // an `error`. Re-resolve THIS track once and reload; if the fresh URL also fails
  // (or there's nothing to resolve), skip to the next track rather than dead-end the
  // queue. The analysis probe is deliberately untouched.
  private onError = (): void => {
    // Ignore the empty-source `error` from stop()'s reset — only a real loaded
    // source that failed should recover.
    if (!this.deps.audioElement.currentSrc) return;
    void this.recoverOrSkip();
  };

  private async recoverOrSkip(): Promise<void> {
    const track = this.current;
    if (!track?.playbackId || this.recovered) {
      this.deps.queue.next();
      return;
    }
    this.recovered = true;
    const url = await this.resolveFreshUrl(track);
    if (this.current !== track) return; // a newer track superseded the recovery
    if (!url) {
      this.deps.queue.next();
      return;
    }
    this.deps.audioElement.src = url;
    void this.resume();
  }

  /** Ask the track's own provider for a fresh stream URL (its old one expired). */
  private async resolveFreshUrl(track: Track): Promise<string | undefined> {
    const resolver = this.deps.providers.get(track.providerId)?.playback;
    if (!resolver || !track.playbackId) return undefined;
    try {
      const urls = await resolver.resolve([track.playbackId]);
      return urls.find((entry) => entry.playbackId === track.playbackId)?.playUrl;
    } catch {
      return undefined;
    }
  }
}

export const playbackPlugin = definePlugin({
  name: "planet.playback",
  requires: { audio: AUDIO_RUNTIME, providers: PROVIDER_REGISTRY, queue: PLAY_QUEUE },
  provides: { transport: TRANSPORT },
  setup(ctx) {
    const adapter = new AudioPlaybackAdapter({
      audioElement: ctx.audio.audioElement,
      providers: ctx.providers,
      queue: ctx.queue,
      broadcast: broadcaster(ctx),
    });
    ctx.on(CURRENT_TRACK_CHANGED, adapter.onCurrentChanged);
    ctx.cleanup(() => adapter.release());
    return { transport: adapter };
  },
});
