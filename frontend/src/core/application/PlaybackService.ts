import type { Capability, Planet } from "../kernel";
import type { MusicProvider } from "@domain";
import { PlaybackIntent } from "@domain/model/playback-intent";
import type { PlaybackAvailabilityPolicy } from "@domain/model/playback-availability";
import type { Track, TrackPlayUrl } from "@domain/model/track";
import { TRANSPORT } from "../plugin/playback";
import { PLAY_QUEUE } from "../plugin/playqueue";
import { VOLUME_CONTROL } from "../plugin/volume";
import { PROGRESS } from "../plugin/progress";
import { warnReadFailure } from "@shared/debug";

/**
 * The playback command API — the single door the UI calls for every playback
 * intent. Commands are direct, typed method calls into the kernel plugins (the
 * runtime adapters over the rich domain), never events on the bus: a command has
 * exactly one receiver, so routing it through fire-and-forget pub/sub would only
 * lose the receiver and the result. State flows back the other way, as events.
 *
 * The service resolves the capabilities it needs from the Planet registry on
 * each call (they're always provided by the time the UI issues a command). It
 * never imports concrete providers or React; provider play-URL resolution comes
 * through the domain port. Dependency direction: core/application → core/kernel
 * + core/plugin + domain.
 */
export class PlaybackService {
  /**
   * Generation guard for play(): a newer play() bumps the counter, so a slow
   * playUrls() resolve from an older call is discarded instead of overwriting
   * the queue with a stale track when the user switches tracks rapidly.
   */
  private playGeneration = 0;

  constructor(
    private readonly planet: Planet,
    private readonly getProvider: () => MusicProvider,
  ) {}

  // ── Queue + play ──────────────────────────────────────────────────

  /**
   * Set the play queue and start at the given track. Resolves playable URLs via
   * the provider first; tracks are cloned so the caller's domain objects are
   * never mutated.
   */
  async play(tracks: Track[], track: Track): Promise<void> {
    const gen = ++this.playGeneration;
    const intent = PlaybackIntent.from(tracks, track);
    const provider = this.getProvider();
    const resolutionPolicy = this.playbackPolicy();

    let urls: readonly TrackPlayUrl[] = [];
    const playbackIdsToResolve = intent.playbackIdsToResolve(resolutionPolicy);
    if (playbackIdsToResolve.length) {
      try {
        urls = await provider.playUrls(playbackIdsToResolve);
      } catch (error) {
        // We only get here for a provider that *claims* playback support (the
        // resolution policy gated on it), so a throw is a real resolve failure,
        // not "unsupported". Surface it, but still switch track on the fallback.
        warnReadFailure(`${provider.name}.playUrls`, error);
      }
    }
    // A newer play() superseded this one while awaiting — drop the stale result.
    if (gen !== this.playGeneration) return;

    const resolved = intent.withResolvedUrls(urls);
    this.queue.playNow(resolved.tracks, resolved.current);
  }

  /**
   * The active provider's playback resolution policy (full-stream vs preview).
   * Used to resolve URLs on play() and, in the UI, to derive per-track
   * availability — one source of truth for "how can this provider play audio".
   */
  playbackPolicy(): PlaybackAvailabilityPolicy {
    const provider = this.getProvider();
    return {
      canResolveFullPlayback: provider.supports("fullPlayback"),
      canUsePreviewPlayback: provider.supports("previewPlayback"),
    };
  }

  /** Start this list in shuffle mode. The queue owns the actual shuffled order. */
  async shufflePlay(tracks: Track[]): Promise<void> {
    if (tracks.length === 0) return;
    this.queue.setShuffle(true);
    await this.play(tracks, tracks[0]);
  }

  selectTrack(track: Track): void {
    this.cancelPendingPlay();
    this.queue.select(track);
  }

  addToQueue(track: Track): void {
    this.queue.add(track);
  }

  addNextToQueue(track: Track): void {
    this.queue.addNext(track);
  }

  removeFromQueue(track: Track): void {
    this.cancelPendingPlay();
    this.queue.remove(track);
  }

  clearQueue(): void {
    this.cancelPendingPlay();
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
    this.cancelPendingPlay();
    this.queue.next();
  }

  previous(): void {
    this.cancelPendingPlay();
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

  private cancelPendingPlay(): void {
    this.playGeneration += 1;
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
