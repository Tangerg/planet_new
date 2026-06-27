import type { IPlanet, IPlugin } from "../kernel";
import type { IProvider } from "@domain";
import type { Track } from "@domain/model/track";
import { Control } from "../plugin/control";
import { PlayQueue } from "../plugin/playqueue";
import { Volume } from "../plugin/volume";
import { Progress } from "../plugin/progress";

/**
 * The playback command API — the single door the UI calls for every playback
 * intent. Commands are direct, typed method calls into the kernel plugins (the
 * runtime adapters over the rich domain), never events on the bus: a command has
 * exactly one receiver, so routing it through fire-and-forget pub/sub would only
 * lose the receiver and the result. State flows back the other way, as events.
 *
 * The service resolves its plugins by id from the Planet on each call (they're
 * always mounted by the time the UI issues a command). It never imports concrete
 * providers or React; provider play-URL resolution comes through the domain port.
 * Dependency direction: core/application → core/kernel + core/plugin + domain.
 */
export class PlaybackService {
  /**
   * Generation guard for play(): a newer play() bumps the counter, so a slow
   * playUrls() resolve from an older call is discarded instead of overwriting
   * the queue with a stale track when the user switches tracks rapidly.
   */
  private playGeneration = 0;

  constructor(
    private readonly planet: IPlanet,
    private readonly getProvider: () => IProvider,
  ) {}

  // ── Queue + play ──────────────────────────────────────────────────

  /**
   * Set the play queue and start at the given track. Resolves playable URLs via
   * the provider first; tracks are cloned so the caller's domain objects are
   * never mutated.
   */
  async play(tracks: Track[], track: Track): Promise<void> {
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
    // A newer play() superseded this one while awaiting — drop the stale result.
    if (gen !== this.playGeneration) return;

    for (const u of urls) {
      const t = queue.find((x) => x.id === u.id);
      if (t) t.playUrl = u.playUrl;
    }
    this.queue.playNow(queue, current);
  }

  selectTrack(track: Track): void {
    this.queue.selectTrack(track);
  }

  addToQueue(track: Track): void {
    this.queue.addToQueue(track);
  }

  removeFromQueue(track: Track): void {
    this.queue.removeFromQueue(track);
  }

  clearQueue(): void {
    this.queue.clearQueue();
  }

  // ── Transport ─────────────────────────────────────────────────────

  /** Toggle play/pause; pass the current playing state to pick the direction. */
  togglePlay(isPlaying: boolean): void {
    if (isPlaying) this.control.pause();
    else void this.control.resume();
  }

  pause(): void {
    this.control.pause();
  }

  resume(): void {
    void this.control.resume();
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

  // ── Plugin resolution ─────────────────────────────────────────────

  private require<T extends IPlugin>(id: string): T {
    const plugin = this.planet.getPlugin<T>(id);
    if (!plugin) {
      throw new Error(`Playback requires the "${id}" plugin, which is not registered.`);
    }
    return plugin;
  }

  private get queue(): PlayQueue {
    return this.require<PlayQueue>(PlayQueue.id);
  }

  private get control(): Control {
    return this.require<Control>(Control.id);
  }

  private get volume(): Volume {
    return this.require<Volume>(Volume.id);
  }

  private get progress(): Progress {
    return this.require<Progress>(Progress.id);
  }
}
