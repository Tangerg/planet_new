import type { IPlanet } from "../kernel";
import type { IProvider } from "@domain";
import type { Track } from "@domain/model/track";

/**
 * Application service for playback use cases.
 *
 * Encapsulates play-URL resolution and kernel command emission so that UI
 * components never touch the provider or the event bus directly. The service
 * is constructed with a Planet (kernel) and a provider getter (domain port);
 * it never imports concrete providers or React.
 *
 * Dependency direction: core/application → core/kernel + domain (inner layers).
 */
export class PlaybackService {
  constructor(
    private readonly planet: IPlanet,
    private readonly getProvider: () => IProvider,
  ) {}

  /**
   * Monotonically increasing generation counter for the play() method.
   * Each call increments before the await; after the await resolves the
   * counter is checked against the captured generation. If they differ, a
   * newer play() call has superseded this one and the stale result is
   * discarded. This prevents a slow playUrls() resolution from overwriting
   * the queue with an outdated track after the user has already requested
   * a different track.
   */
  private playGeneration = 0;

  // ── Queue + play ──────────────────────────────────────────────────

  /**
   * Set the play queue and start at the given track.
   * Resolves playable URLs via the provider before emitting to the kernel.
   * Tracks are cloned internally so the original domain objects are never
   * mutated — the kernel holds its own copies.
   *
   * A generation counter guards against a stale `playUrls()` resolve
   * overwriting the queue when `play()` is called twice rapidly.
   */
  async play(tracks: Track[], track: Track, key = "vibe"): Promise<void> {
    const gen = ++this.playGeneration;
    const items = tracks.length ? tracks : [track];
    const queue = items.map((t) => ({ ...t }));
    const current = queue.find((t) => t.id === track.id) ?? queue[0];
    const ids = queue.map((t) => t.id).filter(Boolean);

    let urls: Array<{ id: string | number; playUrl: string }> = [];
    if (ids.length) {
      try {
        urls = await this.getProvider().playUrls(ids);
      } catch {
        // Provider has no play-URL support: stay silent; the UI still switches track.
      }
    }

    // Stale guard: if a newer play() call has already incremented the
    // generation, discard this result — only the latest call may emit.
    if (gen !== this.playGeneration) return;

    for (const u of urls) {
      const t = queue.find((x) => x.id === u.id);
      if (t) t.playUrl = u.playUrl;
    }

    this.planet.hooks.emit("change_play_queue", { key, tracks: queue, track: current });
  }

  // ── Transport ─────────────────────────────────────────────────────

  /** Toggle play/pause. Pass the current playing state to determine direction. */
  togglePlay(isPlaying: boolean): void {
    this.planet.hooks.emit(isPlaying ? "pause" : "play");
  }

  /** Skip to the next track in the queue. */
  next(): void {
    this.planet.hooks.emit("next_track");
  }

  /** Skip to the previous track in the queue. */
  previous(): void {
    this.planet.hooks.emit("previous_track");
  }

  // ── Progress ──────────────────────────────────────────────────────

  /** Seek to a position (0..100 percent of the track duration). */
  seek(percent: number): void {
    this.planet.hooks.emit("play_time_seek", percent);
  }

  // ── Volume ────────────────────────────────────────────────────────

  /** Set the volume (0..100 on the kernel scale). */
  setVolume(volume: number): void {
    this.planet.hooks.emit("change_volume", volume);
  }

  // ── Shuffle / Repeat ──────────────────────────────────────────────

  /** Toggle shuffle mode. */
  toggleShuffle(): void {
    this.planet.hooks.emit("change_shuffle_enable");
  }

  /** Cycle through repeat modes (OFF → ALL → ONE → OFF). */
  toggleRepeat(): void {
    this.planet.hooks.emit("change_repeat_mode");
  }
}
