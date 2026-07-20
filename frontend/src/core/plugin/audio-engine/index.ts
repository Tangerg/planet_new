import { errorMessage, warn } from "@shared/debug";

import { Plugin, defineCapability } from "../../kernel";
import type { Track } from "@domain/model/track";
import { directMediaAnalysisSource, type MediaAnalysisSourceResolver } from "../media-source";
import { PlayState } from "../playback";
import { AudioAnalysisProbe } from "./analysis-probe";

export interface AnalyserPort {
  /** The shared AnalyserNode reading the visualization-only audio probe. */
  analyser(): AnalyserNode;
}

/** Visualization-only audio analyser probe (visualizers, EQ, …). */
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
  private probe: AudioAnalysisProbe | null = null;
  private playbackState = PlayState.STOPPED;

  constructor(
    private readonly resolveAnalysisSource: MediaAnalysisSourceResolver = directMediaAnalysisSource,
  ) {
    super();
  }

  get id(): string {
    return AudioEngine.id;
  }

  protected onInit(): void {
    this.context.registry.provide(AUDIO_ANALYSER, this);
    this.context.hooks.on("queue:current-changed", this.onCurrentChanged, this);
    this.context.hooks.on("playback:state-changed", this.onPlaybackStateChanged, this);
  }

  protected onDispose(): void {
    this.context.hooks.off("queue:current-changed", this.onCurrentChanged);
    this.context.hooks.off("playback:state-changed", this.onPlaybackStateChanged);
    this.probe?.dispose();
    this.probe = null;
  }

  analyser(): AnalyserNode {
    return this.ensureProbe().analyser();
  }

  private onCurrentChanged = async (track: Track | undefined): Promise<void> => {
    await this.ensureProbe().load(track?.playUrl, () => this.playbackState === PlayState.PLAYING);
  };

  private onPlaybackStateChanged = (state: PlayState): void => {
    this.playbackState = state;
    if (state === PlayState.PLAYING) {
      void this.ensureProbe()
        .play()
        .catch((error: unknown) => {
          this.probe?.pause();
          warn(`audio analysis probe play failed: ${errorMessage(error)}`);
        });
      return;
    }
    this.probe?.pause();
  };

  private ensureProbe(): AudioAnalysisProbe {
    if (this.probe) return this.probe;
    const probe = new AudioAnalysisProbe({
      audioContext: this.context.audioContext,
      playbackElement: this.context.audioElement,
      resolveAnalysisSource: this.resolveAnalysisSource,
      createProbeElement: () => this.context.createAnalysisElement(),
    });
    this.probe = probe;
    return probe;
  }
}
