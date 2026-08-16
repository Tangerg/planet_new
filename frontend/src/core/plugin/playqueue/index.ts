import { definePlugin, service } from "dougong";
import type { Track } from "@domain/model/track";
import { PlayQueue, type RandomSource } from "@domain/model/play-queue";
import { RepeatMode, nextRepeatMode } from "@domain/model/repeat";
import {
  broadcaster,
  CURRENT_TRACK_CHANGED,
  QUEUE_CHANGED,
  REPEAT_CHANGED,
  SHUFFLE_CHANGED,
  TRACK_ENDED,
  type Broadcast,
} from "../../kernel";

/** Queue commands: set/select/add/add-next/remove/clear/next/previous/shuffle/repeat. */
export const PLAY_QUEUE = service<PlayQueueRuntime>("planet/play-queue");

/**
 * Owns the play-queue aggregate (the rules) + the repeat mode, and the runtime
 * wiring around it. Commands arrive as direct method calls from PlaybackService;
 * the runtime mutates the aggregate and broadcasts the resulting facts.
 */
export class PlayQueueRuntime {
  private readonly queue: PlayQueue;
  private repeat = RepeatMode.OFF;

  constructor(
    random: RandomSource,
    private readonly broadcast: Broadcast,
  ) {
    this.queue = new PlayQueue(random);
  }

  // ── Commands (called directly by PlaybackService) ──────────────────

  /** Replace the queue and start at `start` (or the first track). */
  playNow(tracks: readonly Track[], start?: Track): void {
    this.queue.setTracks(tracks, start);
    this.emitQueue();
    this.emitCurrent();
  }

  next(): void {
    if (this.queue.next(this.repeat) === "changed") this.emitCurrent();
  }

  previous(): void {
    if (this.queue.previous(this.repeat) === "changed") this.emitCurrent();
  }

  select(track: Track): void {
    if (this.queue.select(track)) this.emitCurrent();
  }

  add(track: Track): void {
    if (this.queue.add(track)) this.emitQueue();
  }

  addNext(track: Track): void {
    const before = this.queue.current;
    if (!this.queue.addNext(track)) return;
    this.emitQueue();
    if (this.queue.current !== before) this.emitCurrent();
  }

  remove(track: Track): void {
    const before = this.queue.current;
    if (!this.queue.remove(track)) return;
    this.emitQueue();
    if (this.queue.current !== before) this.emitCurrent();
  }

  clear(): void {
    this.queue.clear();
    this.emitQueue();
    this.emitCurrent();
  }

  toggleShuffle(): void {
    this.broadcast(SHUFFLE_CHANGED, this.queue.toggleShuffle());
    this.emitQueue();
  }

  setShuffle(enabled: boolean): void {
    this.broadcast(SHUFFLE_CHANGED, this.queue.setShuffle(enabled));
    this.emitQueue();
  }

  cycleRepeat(): void {
    this.repeat = nextRepeatMode(this.repeat);
    this.broadcast(REPEAT_CHANGED, this.repeat);
  }

  // ── Internal choreography ──────────────────────────────────────────

  /**
   * Auto-advance after the audible element reached the end of a track.
   * "replay" re-emits the same current track (re-loads + restarts it);
   * "advanced" emits the new one; "stopped" leaves playback where it ended.
   */
  advanceAfterTrackEnd(): void {
    if (this.queue.advance(this.repeat) !== "stopped") this.emitCurrent();
  }

  /** Drop the queue contents without announcing it — the runtime is going away. */
  release(): void {
    this.queue.clear();
  }

  private emitQueue(): void {
    this.broadcast(QUEUE_CHANGED, this.queue.playbackOrder);
  }

  private emitCurrent(): void {
    this.broadcast(CURRENT_TRACK_CHANGED, this.queue.current);
  }
}

export type PlayQueueConfig = {
  /** Entropy for shuffling; injected so the queue order stays testable. */
  readonly random: RandomSource;
};

/**
 * The only thing this installation subscribes to is `TRACK_ENDED`, raised by
 * the playback plugin. That stays an Event rather than a dependency edge: the
 * queue must not restart when the transport is replaced, and the transport
 * already depends on the queue for its own skip-on-error path.
 */
export const playQueuePlugin = definePlugin({
  name: "planet.play-queue",
  provides: { queue: PLAY_QUEUE },
  setup(ctx, config: PlayQueueConfig) {
    const runtime = new PlayQueueRuntime(config.random, broadcaster(ctx));
    ctx.on(TRACK_ENDED, () => runtime.advanceAfterTrackEnd());
    ctx.cleanup(() => runtime.release());
    return { queue: runtime };
  },
});
