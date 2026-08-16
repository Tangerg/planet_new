import { definePlugin, service } from "dougong";
import { errorMessage } from "@shared/debug";

import type { Track } from "@domain/model/track";
import { PlayState } from "@domain/model/play-state";
import { AUDIO_RUNTIME, CURRENT_TRACK_CHANGED, PLAY_STATE_CHANGED } from "../../kernel";
import { directMediaAnalysisSource, type MediaAnalysisSourceResolver } from "../media-source";
import { AudioAnalysisProbe } from "./analysis-probe";

export interface AnalyserPort {
  /** The shared AnalyserNode reading the visualization-only audio probe. */
  analyser(): AnalyserNode;
}

/** Visualization-only audio analyser probe (visualizers, EQ, …). */
export const AUDIO_ANALYSER = service<AnalyserPort>("planet/audio-analyser");

export type AudioEngineConfig = {
  /** Rewrites provider URLs into Web-Audio-analysis-safe ones; identity by default. */
  readonly resolveAnalysisSource?: MediaAnalysisSourceResolver;
};

/**
 * Owns a visualization-only Web Audio probe. It deliberately does NOT connect
 * the audible playback element to Web Audio: `createMediaElementSource()` can
 * reroute cross-origin provider playback and make the real player go silent.
 *
 * Instead, a hidden HTMLAudioElement loads the same track (or a loopback proxy
 * URL) and feeds an analyser through a muted sink. If that probe cannot play,
 * visualizers simply fall back to idle motion while native playback continues.
 */
export const audioEnginePlugin = definePlugin({
  name: "planet.audio-engine",
  requires: { audio: AUDIO_RUNTIME },
  provides: { analyser: AUDIO_ANALYSER },
  setup(ctx, config: AudioEngineConfig) {
    let probe: AudioAnalysisProbe | null = null;
    let playbackState = PlayState.STOPPED;

    const ensureProbe = (): AudioAnalysisProbe => {
      probe ??= new AudioAnalysisProbe({
        audioContext: ctx.audio.audioContext,
        playbackElement: ctx.audio.audioElement,
        resolveAnalysisSource: config.resolveAnalysisSource ?? directMediaAnalysisSource,
        createProbeElement: () => ctx.audio.createAnalysisElement(),
      });
      return probe;
    };

    ctx.on(CURRENT_TRACK_CHANGED, async (track: Track | undefined) => {
      await ensureProbe().load(track?.playUrl, () => playbackState === PlayState.PLAYING);
    });

    ctx.on(PLAY_STATE_CHANGED, (state: PlayState) => {
      playbackState = state;
      if (state !== PlayState.PLAYING) {
        probe?.pause();
        return;
      }
      void ensureProbe()
        .play()
        .catch((error: unknown) => {
          probe?.pause();
          ctx.log.warn(`audio analysis probe play failed: ${errorMessage(error)}`);
        });
    });

    ctx.cleanup(() => {
      probe?.dispose();
      probe = null;
    });

    return { analyser: { analyser: () => ensureProbe().analyser() } };
  },
});
