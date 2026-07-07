import type { AudioLightFrame, SpectralLightColors } from "@/model/audio-visualization";
import { audioLanes } from "@/model/audio-visualization";
import { beatEnvelope, type CoverParticles } from "@/model/stage-particles";

// One canonical band resolution the whole engine produces; effects regroup as
// needed (waves draws a ribbon per band, the cloud sums them into bass/mid/treble).
const BANDS = 8;

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
 * Everything an effect consumes for one frame: the reactive audio, the cover-derived
 * palette + particle cloud (optional), sizing, and timing. This is the engine's
 * output; an effect is just a consumer of it (drawing with 2D or WebGL, its choice).
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
  colors: SpectralLightColors;
  /** The current cover as a particle cloud, or null while it loads / can't be read. */
  particles: CoverParticles | null;
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
): { audio: AudioReactive; state: ReactiveState } {
  const lanes = audioLanes(frame, BANDS);
  const bands = lanes.slice(1).map((lane) => lane.energy);
  const overall = playing ? lanes[0].energy : 0.14 + 0.05 * Math.sin(timeSec * 0.8);
  const last = bands.length - 1;
  const bass = group(bands, 0, 2);
  const mid = group(bands, 3, 5);
  const treble = group(bands, 6, last);

  const mean = previous.mean + (overall - previous.mean) * 0.03;
  const burst = Math.max(0, overall - mean) * 3.2;
  const beat = beatEnvelope(previous.beat, Math.min(1.4, burst));

  return {
    audio: { overall, bass, mid, treble, beat, burst, bands },
    state: { mean, beat },
  };
}

// ── Effect contract ──────────────────────────────────────────────────────────
// An effect receives a fresh canvas (so 2D and WebGL contexts never collide) and
// returns an instance that draws one VisualFrame at a time. Adding a visual is: a
// create() consuming the frame + one registry entry — nothing else in the pipeline.
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
  create(canvas: HTMLCanvasElement): VisualEffectInstance;
};
