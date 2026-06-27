import { Plugin, defineCapability } from "../../kernel";
import { Track } from "@domain/model/track";
import { PlayQueue as PlayQueueModel } from "@domain/model/play-queue";
import { RepeatMode, nextRepeatMode } from "@domain/model/repeat";

declare module "../../kernel/event" {
  interface PlanetEventMap {
    "queue:changed": readonly Track[];
    "queue:current-changed": Track | undefined;
    "queue:repeat-changed": RepeatMode;
    "queue:shuffle-changed": boolean;
  }
}

/** Queue commands: set/select/add/remove/clear/next/previous/shuffle/repeat. */
export const PLAY_QUEUE = defineCapability<PlayQueue>("play-queue");

/**
 * Owns the play-queue aggregate (the rules) + the repeat mode, and the runtime
 * wiring around it. Commands arrive as direct method calls from PlaybackService;
 * the plugin mutates the aggregate and broadcasts the resulting facts. The only
 * thing it subscribes to is the internal `playback:track-ended` choreography event
 * (raised by the playback/audio plugin) to auto-advance.
 */
export class PlayQueue extends Plugin {
  public static readonly id = "play-queue";
  private readonly queue = new PlayQueueModel();
  private repeat = RepeatMode.OFF;

  get id(): string {
    return PlayQueue.id;
  }

  protected onInit(): void {
    this.context.registry.provide(PLAY_QUEUE, this);
    this.context.hooks.on("playback:track-ended", this.onTrackEnded, this);
  }

  protected onDispose(): void {
    this.context.hooks.off("playback:track-ended", this.onTrackEnded);
    this.queue.clear();
  }

  // ── Commands (called directly by PlaybackService) ──────────────────

  /** Replace the queue and start at `start` (or the first track). */
  playNow(tracks: readonly Track[], start?: Track): void {
    this.queue.setTracks(tracks, start);
    this.emitQueue();
    this.emitCurrent();
  }

  next(): void {
    this.queue.next();
    this.emitCurrent();
  }

  previous(): void {
    this.queue.previous();
    this.emitCurrent();
  }

  selectTrack(track: Track): void {
    if (this.queue.select(track)) this.emitCurrent();
  }

  addToQueue(track: Track): void {
    this.queue.add(track);
    this.emitQueue();
  }

  removeFromQueue(track: Track): void {
    const before = this.queue.current;
    this.queue.remove(track);
    this.emitQueue();
    if (this.queue.current !== before) this.emitCurrent();
  }

  clearQueue(): void {
    this.queue.clear();
    this.emitQueue();
    this.emitCurrent();
  }

  toggleShuffle(): void {
    this.context.hooks.emit("queue:shuffle-changed", this.queue.toggleShuffle());
  }

  cycleRepeat(): void {
    this.repeat = nextRepeatMode(this.repeat);
    this.context.hooks.emit("queue:repeat-changed", this.repeat);
  }

  // ── Internal choreography ──────────────────────────────────────────

  private onTrackEnded = (): void => {
    // "replay" re-emits the same current track (re-loads + restarts it);
    // "advanced" emits the new one; "stopped" leaves playback where it ended.
    if (this.queue.advance(this.repeat) !== "stopped") this.emitCurrent();
  };

  private emitQueue(): void {
    this.context.hooks.emit("queue:changed", this.queue.tracks);
  }

  private emitCurrent(): void {
    this.context.hooks.emit("queue:current-changed", this.queue.current);
  }
}
