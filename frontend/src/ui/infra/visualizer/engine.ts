import type { AudioLightFrame } from "@/model/audio-visualization";
import { audioLanes } from "@/model/audio-visualization";
import { beatEnvelope } from "@/model/stage-particles";

// The engine is AUDIO ONLY. Cover art, lyrics, and any other non-audio material are
// the drawing side's concern — an effect fetches them itself (see cover.ts) so the
// engine never grows a dependency on them. Everything below is audio processing +
// the per-effect tuning of that processing.

/** The audio, reduced to the reactive values effects actually draw from — computed
 *  once by the engine so no effect re-derives them. All 0..1 (AGC-centred ≈ 0.5). */
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
 * Per-effect tuning of the audio pipeline. Defaults (DEFAULT_ENGINE_CONFIG) are the
 * values the player-bar waves use; an effect overrides only what fits its character
 * — a gentle effect softens the smoothing/contrast, an agitated one snaps it up.
 */
export type EngineConfig = {
  // Sampling (AnalyserNode).
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
  // Adaptive gain (per-band dynamics).
  levelRise: number;
  levelFall: number;
  levelTarget: number;
  levelContrast: number;
  // Display damping (how fast bands rise/fall on screen).
  attack: number;
  release: number;
  // Reactive shaping.
  bands: number; // how many bands effects receive
  burstGain: number; // beat/transient sensitivity
};

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
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

export function resolveEngineConfig(tuning?: Partial<EngineConfig>): EngineConfig {
  return tuning ? { ...DEFAULT_ENGINE_CONFIG, ...tuning } : DEFAULT_ENGINE_CONFIG;
}

/**
 * Everything an effect consumes for one frame: the reactive audio (the engine's
 * output), sizing/timing, and the render context it may fetch its own material from
 * (the cover URL + theme accent). Cover pixels / palette / lyrics are NOT here — an
 * effect loads what it wants from `image`.
 */
export type VisualFrame = {
  width: number;
  height: number;
  dpr: number;
  timeSec: number;
  /** Seconds since the previous frame (clamped), for frame-rate-independent motion. */
  dtSec: number;
  playing: boolean;
  audio: AudioReactive;
  /** Current cover URL — an effect may load/sample it (via cover.ts) if it wants. */
  image?: string;
  /** Theme accent — a palette fallback when there's no cover. */
  accent: string;
};

/** Persisted reactive state (running mean + beat) the engine threads across frames. */
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
 * Reduce a spectrum frame to the reactive values (bass/mid/treble/beat/burst/…) and
 * the next running state. Pure — the host holds the state. When paused, `overall`
 * breathes gently so idle-capable effects still move.
 */
export function audioReactive(
  frame: AudioLightFrame,
  previous: ReactiveState,
  playing: boolean,
  timeSec: number,
  config: EngineConfig,
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

// ── Effect contract ──────────────────────────────────────────────────────────
// An effect receives a fresh canvas (so 2D and WebGL contexts never collide) and
// returns an instance that draws one VisualFrame at a time. Adding a visual is: a
// create() consuming the frame + one registry entry. An effect may declare `tuning`
// to shape the audio the engine feeds it.
export type VisualEffectInstance = {
  /** Backing store was resized; re-set the viewport / transform. */
  resize?(width: number, height: number, dpr: number): void;
  draw(frame: VisualFrame): void;
  dispose?(): void;
};

export type VisualEffect = {
  id: string;
  /** i18n key for the switcher label. */
  labelKey: string;
  /** Optional per-effect audio-pipeline tuning (merged over DEFAULT_ENGINE_CONFIG). */
  tuning?: Partial<EngineConfig>;
  create(canvas: HTMLCanvasElement): VisualEffectInstance;
};
