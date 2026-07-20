import type { Capability, Planet } from "../kernel";
import type { PlaybackResolverRegistry } from "@domain";
import type { PlaybackAvailabilityPolicy } from "@domain/model/playback-availability";
import type { Track } from "@domain/model/track";
import { TRANSPORT } from "../plugin/playback";
import { PLAY_QUEUE } from "../plugin/playqueue";
import { VOLUME_CONTROL } from "../plugin/volume";
import { PROGRESS } from "../plugin/progress";

/**
 * The playback command API — the single door the UI calls for every playback
 * intent. Commands are direct, typed method calls into the kernel plugins (the
 * runtime adapters over the rich domain), never events on the bus: a command has
 * exactly one receiver, so routing it through fire-and-forget pub/sub would only
 * lose the receiver and the result. State flows back the other way, as events.
 *
 * Play URLs are resolved JUST IN TIME — the playback plugin resolves each track's
 * URL when it becomes current, because provider stream URLs are short-lived and
 * resolving a whole queue up front would leave later tracks with expired URLs.
 *
 * The service resolves the capabilities it needs from the Planet registry on
 * each call (they're always provided by the time the UI issues a command). It
 * never imports concrete providers or React. Dependency direction:
 * core/application → core/kernel + core/plugin + domain.
 */
export class PlaybackService {
  constructor(
    private readonly planet: Planet,
    private readonly resolvers: PlaybackResolverRegistry,
  ) {}

  // ── Queue + play ──────────────────────────────────────────────────

  /**
   * Set the play queue and start at the given track. The queue stores the tracks
   * as-is; the playback plugin resolves the current track's fresh play URL when it
   * starts (and again on each auto-advance), so URLs never go stale in the queue.
   */
  play(tracks: Track[], track: Track): void {
    this.queue.playNow(tracks, track);
  }

  /**
   * The active provider's playback resolution policy (full-stream vs preview).
   * The UI uses it to derive per-track availability — one source of truth for
   * "how can this provider play audio".
   */
  playbackPolicy(): PlaybackAvailabilityPolicy {
    return this.resolvers.active().policy;
  }

  /** Start this list in shuffle mode. The queue owns the actual shuffled order. */
  shufflePlay(tracks: Track[]): void {
    if (tracks.length === 0) return;
    this.queue.setShuffle(true);
    this.play(tracks, tracks[0]);
  }

  selectTrack(track: Track): void {
    this.queue.select(track);
  }

  addToQueue(track: Track): void {
    this.queue.add(track);
  }

  addNextToQueue(track: Track): void {
    this.queue.addNext(track);
  }

  removeFromQueue(track: Track): void {
    this.queue.remove(track);
  }

  clearQueue(): void {
    this.queue.clear();
  }

  // ── Transport ─────────────────────────────────────────────────────

  /** Toggle play/pause; pass the current playing state to pick the direction. */
  togglePlay(isPlaying: boolean): void {
    if (isPlaying) this.playback.pause();
    else void this.playback.resume();
  }

  pause(): void {
    this.playback.pause();
  }

  resume(): void {
    void this.playback.resume();
  }

  next(): void {
    this.queue.next();
  }

  previous(): void {
    this.queue.previous();
  }

  /** Seek to a position (0..100 percent of the track duration). */
  seek(percent: number): void {
    this.progress.seek(percent);
  }

  // ── Volume ────────────────────────────────────────────────────────

  /** Set the volume (0..100). */
  setVolume(level: number): void {
    this.volume.setVolume(level);
  }

  toggleMute(): void {
    this.volume.toggleMute();
  }

  // ── Shuffle / repeat ──────────────────────────────────────────────

  toggleShuffle(): void {
    this.queue.toggleShuffle();
  }

  /** Cycle repeat mode (Off → All → One → Off). */
  cycleRepeat(): void {
    this.queue.cycleRepeat();
  }

  // ── Capability resolution ─────────────────────────────────────────

  private require<T>(cap: Capability<T>): T {
    const impl = this.planet.resolve(cap);
    if (!impl) {
      throw new Error(`Playback requires the "${cap.key}" capability, which is not provided.`);
    }
    return impl;
  }

  private get queue() {
    return this.require(PLAY_QUEUE);
  }

  private get playback() {
    return this.require(TRANSPORT);
  }

  private get volume() {
    return this.require(VOLUME_CONTROL);
  }

  private get progress() {
    return this.require(PROGRESS);
  }
}
