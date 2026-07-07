import {
  initialAudioLightFrameState,
  nextAudioLightFrame,
  type AudioLightFrame,
  type AudioLightFrameState,
} from "./frame";
import { audioLanes } from "./lanes";
import { beatEnvelope } from "./spectrum";

// Internal spectral resolution; consumers regroup via config.bands.
const BAND_COUNT = 18;

/** The audio, reduced to the reactive values consumers actually draw from —
 *  computed once by the engine so nothing re-derives them. All 0..1 (AGC-centred
 *  ≈ 0.5). */
export type AudioReactive = {
  /** Whole-mix energy. */
  overall: number;
  bass: number;
  mid: number;
  treble: number;
  /** Smoothed beat envelope (fast rise, slow fall). */
  beat: number;
  /** Instantaneous transient: how far the moment sits above its running mean. */
  burst: number;
  /** Per-band energies, low → high. */
  bands: readonly number[];
};

/**
 * Tuning of the whole audio pipeline. Defaults (DEFAULT_AUDIO_ENGINE_CONFIG) suit a
 * gentle, flowing visual; a consumer overrides only what fits its character — an
 * agitated one snaps up the smoothing/contrast/beat. `fftSize`/`smoothing*`/`*Decibels`
 * configure the sampler the caller drives; the rest shape this engine's DSP.
 */
export type AudioEngineConfig = {
  // Sampling (AnalyserNode — applied by the caller when it samples).
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
  // Adaptive gain (per-band dynamics).
  levelRise: number;
  levelFall: number;
  levelTarget: number;
  levelContrast: number;
  // Display damping (how fast bands rise/fall).
  attack: number;
  release: number;
  // Reactive shaping.
  bands: number; // how many bands consumers receive
  burstGain: number; // beat/transient sensitivity
};

export const DEFAULT_AUDIO_ENGINE_CONFIG: AudioEngineConfig = {
  fftSize: 2048,
  smoothingTimeConstant: 0.5,
  minDecibels: -100,
  maxDecibels: -12,
  levelRise: 0.12,
  levelFall: 0.035,
  levelTarget: 0.5,
  levelContrast: 1.6,
  attack: 0.82,
  release: 0.46,
  bands: 8,
  burstGain: 3.2,
};

export function resolveAudioEngineConfig(tuning?: Partial<AudioEngineConfig>): AudioEngineConfig {
  return tuning ? { ...DEFAULT_AUDIO_ENGINE_CONFIG, ...tuning } : DEFAULT_AUDIO_ENGINE_CONFIG;
}

/** Running reactive state (mean + beat) threaded across frames. */
export type ReactiveState = {
  mean: number;
  beat: number;
};

export const initialReactiveState: ReactiveState = { mean: 0.5, beat: 0 };

function group(bands: readonly number[], from: number, to: number): number {
  let sum = 0;
  for (let i = from; i <= to; i++) sum += bands[i] ?? 0;
  return sum / (to - from + 1);
}

/**
 * Reduce a display frame to the reactive values (bass/mid/treble/beat/burst/…) and
 * the next running state. Pure. When paused, `overall` breathes gently so
 * idle-capable consumers still move.
 */
export function audioReactive(
  frame: AudioLightFrame,
  previous: ReactiveState,
  playing: boolean,
  timeSec: number,
  config: AudioEngineConfig,
): { audio: AudioReactive; state: ReactiveState } {
  const lanes = audioLanes(frame, config.bands);
  const bands = lanes.slice(1).map((lane) => lane.energy);
  const overall = playing ? lanes[0].energy : 0.14 + 0.05 * Math.sin(timeSec * 0.8);
  const last = bands.length - 1;
  const bass = group(bands, 0, 2);
  const mid = group(bands, 3, 5);
  const treble = group(bands, 6, last);

  const mean = previous.mean + (overall - previous.mean) * 0.03;
  const burst = Math.max(0, overall - mean) * config.burstGain;
  const beat = beatEnvelope(previous.beat, Math.min(1.4, burst));

  return {
    audio: { overall, bass, mid, treble, beat, burst, bands },
    state: { mean, beat },
  };
}

/**
 * A stateful audio-reactive engine: feed it raw FFT bytes each frame and it returns
 * the reactive values, holding the frame + AGC + beat state internally. This is the
 * whole engine surface a consumer needs — create one per consumer (with its tuning),
 * call analyze() per frame. Config also carries the sampler settings the caller
 * applies when it fills `bytes`.
 */
export type AudioEngine = {
  readonly config: AudioEngineConfig;
  /** `read` = whether `bytes` are fresh (false when paused / no analyser). */
  analyze(
    bytes: ArrayLike<number>,
    ctx: { read: boolean; playing: boolean; timeSec: number },
  ): AudioReactive;
  reset(): void;
};

export function createAudioEngine(tuning?: Partial<AudioEngineConfig>): AudioEngine {
  const config = resolveAudioEngineConfig(tuning);
  const gain = {
    rise: config.levelRise,
    fall: config.levelFall,
    target: config.levelTarget,
    contrast: config.levelContrast,
  };
  let frame: AudioLightFrameState = initialAudioLightFrameState(BAND_COUNT);
  let reactive: ReactiveState = initialReactiveState;

  return {
    config,
    analyze(bytes, { read, playing, timeSec }) {
      frame = nextAudioLightFrame({
        previous: frame,
        bytes,
        read,
        bandCount: BAND_COUNT,
        attack: config.attack,
        release: config.release,
        gain,
      });
      const derived = audioReactive(frame, reactive, playing, timeSec, config);
      reactive = derived.state;
      return derived.audio;
    },
    reset() {
      frame = initialAudioLightFrameState(BAND_COUNT);
      reactive = initialReactiveState;
    },
  };
}
