import type { Host, Service } from "dougong";
import type { PlaybackResolverRegistry, ProviderId } from "@domain";
import { PlaybackIntent } from "@domain/model/playback-intent";
import type { PlaybackAvailabilityPolicy } from "@domain/model/playback-availability";
import type { ProviderTrackPlayUrls, Track, TrackPlayUrl } from "@domain/model/track";
import { TRANSPORT } from "../plugin/playback";
import { PLAY_QUEUE } from "../plugin/playqueue";
import { VOLUME_CONTROL } from "../plugin/volume";
import { PROGRESS } from "../plugin/progress";
import { warnReadFailure } from "@shared/debug";

/** A provider declared playback resolution but faulted while executing it. */
export class PlaybackResolutionError extends Error {
  constructor(
    readonly providerId: ProviderId,
    readonly source: string,
    options: { cause: unknown },
  ) {
    super(`${source}.resolvePlayback failed`, options);
    this.name = "PlaybackResolutionError";
  }
}

/** Per-source result of preparing one playback intent. A successful provider
 * call can still be partial or unresolved; neither is conflated with a fault. */
export type PlaybackResolutionOutcome =
  | Readonly<{ status: "notRequired"; providerId: ProviderId }>
  | Readonly<{ status: "sourceUnavailable"; providerId: ProviderId }>
  | Readonly<{
      status: "failed";
      providerId: ProviderId;
      error: PlaybackResolutionError;
    }>
  | Readonly<{
      status: "resolved" | "partial" | "unresolved";
      providerId: ProviderId;
      requested: number;
      resolved: number;
    }>;

/** Observable result of a command that attempts to start playback. */
export type PlaybackStartOutcome =
  | Readonly<{
      status: "started" | "superseded";
      resolutions: readonly PlaybackResolutionOutcome[];
    }>
  | Readonly<{ status: "empty"; resolutions: readonly [] }>;

type ProviderResolution = Readonly<{
  playUrls: ProviderTrackPlayUrls;
  outcome: PlaybackResolutionOutcome;
}>;

type CompletedResolutionStatus = "resolved" | "partial" | "unresolved";

/**
 * The playback command API — the single door the UI calls for every playback
 * intent. Commands are direct, typed method calls into the kernel plugins (the
 * runtime adapters over the rich domain), never events on the bus: a command has
 * exactly one receiver, so routing it through fire-and-forget pub/sub would only
 * lose the receiver and the result. State flows back the other way, as events.
 *
 * The service resolves the Services it needs from the Host on each call (they're
 * always active by the time the UI issues a command). It never imports concrete
 * providers or React; provider play-URL resolution comes through the domain
 * port. Dependency direction: core/application → core/kernel + core/plugin +
 * domain.
 */
export class PlaybackService {
  /**
   * Generation guard for play(): a newer play() bumps the counter, so a slow
   * playUrls() resolve from an older call is discarded instead of overwriting
   * the queue with a stale track when the user switches tracks rapidly.
   */
  private playGeneration = 0;

  constructor(
    private readonly host: Host,
    private readonly resolvers: PlaybackResolverRegistry,
  ) {}

  // ── Queue + play ──────────────────────────────────────────────────

  /**
   * Set the play queue and start at the given track. Resolves playable URLs via
   * the provider first; tracks are cloned so the caller's domain objects are
   * never mutated.
   */
  async play(tracks: Track[], track: Track): Promise<PlaybackStartOutcome> {
    const gen = ++this.playGeneration;
    const intent = PlaybackIntent.from(tracks, track);
    const resolutions = await Promise.all(
      intent.providerIds.map((providerId) => this.resolveUrls(intent, providerId)),
    );
    const outcomes = resolutions.map(({ outcome }) => outcome);
    // A newer play() superseded this one while awaiting — drop the stale result.
    if (gen !== this.playGeneration) return { status: "superseded", resolutions: outcomes };

    const resolved = intent.withResolvedUrls(resolutions.map(({ playUrls }) => playUrls));
    this.queue.playNow(resolved.tracks, resolved.current);
    return { status: "started", resolutions: outcomes };
  }

  /**
   * The active provider's playback resolution policy (full-stream vs preview).
   * Used to resolve URLs on play() and, in the UI, to derive per-track
   * availability — one source of truth for "how can this provider play audio".
   */
  playbackPolicy(): PlaybackAvailabilityPolicy {
    return this.resolvers.active().policy;
  }

  private async resolveUrls(
    intent: PlaybackIntent,
    providerId: ProviderId,
  ): Promise<ProviderResolution> {
    const resolver = this.resolvers.get(providerId);
    if (!resolver) {
      warnReadFailure(
        `playback provider ${providerId}`,
        new Error("The track source is no longer registered."),
      );
      return {
        playUrls: { providerId, urls: [] },
        outcome: { status: "sourceUnavailable", providerId },
      };
    }
    const playbackIds = intent.playbackIdsToResolve(providerId, resolver.policy);
    if (!playbackIds.length) {
      return {
        playUrls: { providerId, urls: [] },
        outcome: { status: "notRequired", providerId },
      };
    }
    try {
      const urls = await resolver.resolve(playbackIds);
      const resolved = resolvedURLCount(playbackIds, urls);
      const status = completedResolutionStatus(playbackIds.length, resolved);
      return {
        playUrls: { providerId, urls },
        outcome: { status, providerId, requested: playbackIds.length, resolved },
      };
    } catch (cause) {
      // A declared playback capability failed. Keep the queue transition
      // resilient, but make the adapter fault observable.
      warnReadFailure(`${resolver.diagnosticName}.resolvePlayback`, cause);
      return {
        playUrls: { providerId, urls: [] },
        outcome: {
          status: "failed",
          providerId,
          error: new PlaybackResolutionError(providerId, resolver.diagnosticName, { cause }),
        },
      };
    }
  }

  /** Start this list in shuffle mode. The queue owns the actual shuffled order. */
  async shufflePlay(tracks: Track[]): Promise<PlaybackStartOutcome> {
    if (tracks.length === 0) return { status: "empty", resolutions: [] };
    this.queue.setShuffle(true);
    return this.play(tracks, tracks[0]);
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

  // ── Service resolution ────────────────────────────────────────────

  private require<T>(token: Service<T>): T {
    return this.host.get(token);
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

function resolvedURLCount(requestedIDs: readonly string[], urls: readonly TrackPlayUrl[]): number {
  const requested = new Set(requestedIDs);
  return new Set(
    urls
      .filter(({ playbackId, playUrl }) => requested.has(playbackId) && Boolean(playUrl.trim()))
      .map(({ playbackId }) => playbackId),
  ).size;
}

function completedResolutionStatus(requested: number, resolved: number): CompletedResolutionStatus {
  if (resolved === requested) return "resolved";
  if (resolved === 0) return "unresolved";
  return "partial";
}
