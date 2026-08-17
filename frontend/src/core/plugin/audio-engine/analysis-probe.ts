import { errorMessage, warn } from "@shared/debug";
import { abandonOnAbort } from "@shared/async";

import {
  directMediaAnalysisSource,
  resolveAnalysisSourceUrl,
  type MediaAnalysisSourceResolver,
} from "../media-source";

export type AudioAnalysisProbeClock = {
  now(): number;
};

export type AudioAnalysisProbeOptions = {
  audioContext: AudioContext;
  playbackElement: HTMLAudioElement;
  resolveAnalysisSource?: MediaAnalysisSourceResolver;
  createProbeElement: () => HTMLAudioElement;
  clock?: AudioAnalysisProbeClock;
};

const performanceClock: AudioAnalysisProbeClock = {
  now: () => performance.now(),
};

/**
 * Visualization-only audio probe. It owns the hidden media element and Web Audio
 * graph used for frequency analysis, keeping the audible playback element out
 * of createMediaElementSource so provider playback stays reliable.
 */
export class AudioAnalysisProbe {
  private readonly resolveAnalysisSource: MediaAnalysisSourceResolver;
  private readonly createProbeElement: () => HTMLAudioElement;
  private readonly clock: AudioAnalysisProbeClock;
  private node: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private silentSink: GainNode | null = null;
  private probe: HTMLAudioElement | null = null;
  private lastClockSyncAt = 0;

  constructor(private readonly options: AudioAnalysisProbeOptions) {
    this.resolveAnalysisSource = options.resolveAnalysisSource ?? directMediaAnalysisSource;
    this.createProbeElement = options.createProbeElement;
    this.clock = options.clock ?? performanceClock;
  }

  analyser(): AnalyserNode {
    const probe = this.ensureProbe();
    const node = this.ensureGraph(probe);
    this.syncProbeClock(probe);
    return node;
  }

  /**
   * Point the probe at a track. Staleness is the caller's to declare: resolving
   * an analysis URL can outlive the track that asked for it, and the owner of
   * that race is the plugin whose Lifetime spawned the load, not this element.
   */
  async load(
    playUrl: string | undefined,
    shouldPlay: () => boolean,
    signal: AbortSignal,
  ): Promise<void> {
    if (!playUrl) {
      this.clear();
      return;
    }

    this.pause();
    let analysisUrl: string;
    try {
      analysisUrl = await abandonOnAbort(signal, () =>
        resolveAnalysisSourceUrl(this.resolveAnalysisSource, playUrl),
      );
    } catch {
      return; // superseded or torn down while the analysis URL was resolving
    }

    try {
      this.loadProbe(analysisUrl);
      if (shouldPlay()) await this.play();
    } catch (error) {
      this.pause();
      warn(`audio analysis probe load failed: ${errorMessage(error)}`);
    }
  }

  async play(): Promise<void> {
    const probe = this.probe;
    if (!probe?.src) return;
    this.ensureGraph(probe);
    this.syncProbeClock(probe, true);
    if (this.options.audioContext.state === "suspended") await this.options.audioContext.resume();
    try {
      await probe.play();
    } catch (error) {
      // A superseded play — a newer load()/play()/seek interrupted this one —
      // rejects with AbortError. That's benign for the visualization probe (the
      // newer call takes over); swallow it so the caller doesn't treat it as a
      // fault and pause the probe, which would leave the analyser silent.
      if (!(error instanceof DOMException) || error.name !== "AbortError") throw error;
    }
  }

  pause(): void {
    this.probe?.pause();
  }

  clear(): void {
    this.pause();
    this.probe?.removeAttribute("src");
    this.probe?.load();
  }

  dispose(): void {
    this.clear();
    this.source?.disconnect();
    this.node?.disconnect();
    this.silentSink?.disconnect();
    this.probe = null;
    this.source = null;
    this.node = null;
    this.silentSink = null;
  }

  private loadProbe(url: string): void {
    const probe = this.ensureProbe();
    this.ensureGraph(probe);
    if (probe.src !== url) {
      probe.pause();
      probe.crossOrigin = "anonymous";
      probe.src = url;
      probe.load();
    }
    this.syncProbeClock(probe, true);
  }

  private ensureProbe(): HTMLAudioElement {
    if (this.probe) return this.probe;
    const probe = this.createProbeElement();
    probe.preload = "auto";
    probe.crossOrigin = "anonymous";
    this.probe = probe;
    return probe;
  }

  private ensureGraph(probe: HTMLAudioElement): AnalyserNode {
    if (this.node) return this.node;
    const source = this.options.audioContext.createMediaElementSource(probe);
    const analyser = this.options.audioContext.createAnalyser();
    const silentSink = this.options.audioContext.createGain();
    silentSink.gain.value = 0;
    source.connect(analyser);
    analyser.connect(silentSink);
    silentSink.connect(this.options.audioContext.destination);
    this.source = source;
    this.node = analyser;
    this.silentSink = silentSink;
    return analyser;
  }

  private syncProbeClock(probe: HTMLAudioElement, force = false): void {
    const now = this.clock.now();
    if (!force && now - this.lastClockSyncAt < 1000) return;
    this.lastClockSyncAt = now;
    const main = this.options.playbackElement;
    if (!Number.isFinite(main.currentTime) || !Number.isFinite(probe.currentTime)) return;
    if (force || Math.abs(probe.currentTime - main.currentTime) > 1.25) {
      try {
        probe.currentTime = main.currentTime;
      } catch {
        // Some remote streams are not seekable until metadata arrives. Sampling
        // still works; exact clock sync catches up once the probe allows it.
      }
    }
  }
}
