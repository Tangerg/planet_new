import { Plugin, defineCapability } from "../../kernel";

export interface AnalyserPort {
  /** The shared AnalyserNode reading the visualization-only audio probe. */
  analyser(): AnalyserNode;
  /** Load and play a visualization-only source. It must never affect audible playback. */
  setSource(url: string): Promise<void>;
  /** Pause the visualization-only source. */
  stop(): void;
}

/** Visualization-only audio analyser probe (visualizers, equalizers, …). */
export const AUDIO_ANALYSER = defineCapability<AnalyserPort>("audio-analyser");

/**
 * Owns a visualization-only Web Audio probe. It deliberately does NOT connect
 * the audible playback element to Web Audio: `createMediaElementSource()` can
 * reroute cross-origin provider playback and make the real player go silent.
 *
 * Instead, a hidden HTMLAudioElement loads the same track (or a loopback proxy
 * URL) and feeds an analyser through a muted sink. If that probe cannot play,
 * visualizers simply fall back to idle motion while native playback continues.
 */
export class AudioEngine extends Plugin implements AnalyserPort {
  public static readonly id = "audio-engine";
  private node: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private silentSink: GainNode | null = null;
  private probe: HTMLAudioElement | null = null;
  private lastClockSyncAt = 0;

  get id(): string {
    return AudioEngine.id;
  }

  protected onInit(): void {
    this.context.registry.provide(AUDIO_ANALYSER, this);
  }

  protected onDispose(): void {
    this.probe?.pause();
    this.probe?.removeAttribute("src");
    this.probe?.load();
    this.source?.disconnect();
    this.node?.disconnect();
    this.silentSink?.disconnect();
    this.probe = null;
    this.source = null;
    this.node = null;
    this.silentSink = null;
  }

  analyser(): AnalyserNode {
    const probe = this.ensureProbe();
    const node = this.ensureGraph(probe);
    this.syncProbeClock(probe);
    return node;
  }

  async setSource(url: string): Promise<void> {
    if (!url) {
      this.stop();
      return;
    }
    const probe = this.ensureProbe();
    this.ensureGraph(probe);
    if (probe.src !== url) {
      probe.pause();
      probe.crossOrigin = "anonymous";
      probe.src = url;
      probe.load();
    }
    this.syncProbeClock(probe, true);
    const ctx = this.context.audioContext;
    if (ctx.state === "suspended") await ctx.resume();
    await probe.play();
  }

  stop(): void {
    this.probe?.pause();
  }

  private ensureProbe(): HTMLAudioElement {
    if (this.probe) return this.probe;
    const probe = new Audio();
    probe.preload = "auto";
    probe.crossOrigin = "anonymous";
    this.probe = probe;
    return probe;
  }

  private ensureGraph(probe: HTMLAudioElement): AnalyserNode {
    if (this.node) return this.node;
    const ctx = this.context.audioContext;
    const source = ctx.createMediaElementSource(probe);
    const analyser = ctx.createAnalyser();
    const silentSink = ctx.createGain();
    silentSink.gain.value = 0;
    source.connect(analyser);
    analyser.connect(silentSink);
    silentSink.connect(ctx.destination);
    this.source = source;
    this.node = analyser;
    this.silentSink = silentSink;
    return analyser;
  }

  private syncProbeClock(probe: HTMLAudioElement, force = false): void {
    const now = performance.now();
    if (!force && now - this.lastClockSyncAt < 1000) return;
    this.lastClockSyncAt = now;
    const main = this.context.audioElement;
    if (!Number.isFinite(main.currentTime) || !Number.isFinite(probe.currentTime)) return;
    if (force || Math.abs(probe.currentTime - main.currentTime) > 1.25) {
      try {
        probe.currentTime = main.currentTime;
      } catch {
        // Some remote streams are not seekable until metadata arrives. Sampling
        // will still work; exact clock sync catches up once the probe allows it.
      }
    }
  }
}
