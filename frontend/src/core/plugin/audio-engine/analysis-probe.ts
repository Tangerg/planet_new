import { errorMessage, warn } from "@shared/debug";

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
  private sourceGeneration = 0;

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

  async load(playUrl: string | undefined, shouldPlay: () => boolean): Promise<void> {
    const generation = ++this.sourceGeneration;
    if (!playUrl) {
      this.clear();
      return;
    }

    this.pause();
    const analysisUrl = await resolveAnalysisSourceUrl(this.resolveAnalysisSource, playUrl);
    if (generation !== this.sourceGeneration) return;

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
    await probe.play();
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
    this.sourceGeneration++;
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
