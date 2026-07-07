import { clamp } from "@shared/math";

import {
  audioLanes,
  hsla,
  spectralLightColors,
  type AudioLightFrame,
  type HslColor,
} from "@/model/audio-visualization";

type SpectralPaintColors = ReturnType<typeof spectralLightColors>;

/** Colour for a lane — sampled from the cover tonal ramp at t∈[0,1] (deep→bright).
 *  A rendering concern: the lane data itself carries no colour. */
function laneColor(colors: SpectralPaintColors, t: number): HslColor {
  const stops = colors.stops;
  if (stops.length === 0) return { h: 280, s: 40, l: 50 };
  const x = clamp(0, 1, t) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const a = stops[i].color;
  const b = stops[i + 1].color;
  return { h: a.h + (b.h - a.h) * f, s: a.s + (b.s - a.s) * f, l: a.l + (b.l - a.l) * f };
}

export type BreathingLightSkin = {
  accent: string;
  /** The cover's ranked theme colours (hex) — the lanes are toned from these. */
  tones: readonly string[];
};

export type BreathingLightPaintInput = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  timeSec: number;
  playing: boolean;
  skin: BreathingLightSkin;
  frame: AudioLightFrame;
};

// Frequency-band lanes; audioLanes() prepends one raw/overall track, so the bar
// shows BAND_LANES + 1 waves. Band lanes are the standard real-time proxy for
// "per-instrument" (true stems aren't in the mix we get).
const BAND_LANES = 6;

type LaneStyle = {
  speed: number;
  waves: number;
  amp: number;
  phase: number;
  alpha: number;
  react: number;
  rest: number;
};

// The AGC centres every band at this level (its LEVEL_TARGET), so a lane sitting at
// its running level renders here; the beat swings it above/below.
const LANE_CENTER = 0.5;

// Deterministic, non-monotonic 0..1 per lane. Two out-of-phase sines (different
// frequency + phase) give each lane independent height and reactivity character, so
// the stack reads as uneven, layered waves ("错落有致") instead of one uniform blob —
// and it scales to any lane count.
function laneWave(index: number, freq: number, phase: number): number {
  return 0.5 + 0.5 * Math.sin(index * freq + phase);
}

// Per-lane render params. `rest` = resting height and `react` = how hard the beat
// swings this lane — staggered independently, so some lanes are tall & calm and
// others low & jumpy. speed/waves/phase give each its own horizontal flow.
function laneStyle(index: number): LaneStyle {
  const vh = laneWave(index, 1.7, 1.0); // resting-height character
  const vr = laneWave(index, 1.1, 4.3); // reactivity character
  return {
    speed: (0.7 + index * 0.32) * (index % 2 === 0 ? 1 : -1),
    waves: 1.2 + index * 0.38,
    amp: 0.05 + vh * 0.05,
    phase: index * 1.1,
    alpha: 0.22 + vr * 0.13,
    react: 0.35 + vr * 0.7,
    rest: 0.16 + vh * 0.5,
  };
}

function paintLane(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number,
  centerHeight: number,
  color: HslColor,
  style: LaneStyle,
): void {
  ctx.globalAlpha = style.alpha;
  ctx.fillStyle = hsla(color, 1);
  ctx.beginPath();
  ctx.moveTo(0, height + 2);
  const steps = 80;
  for (let s = 0; s <= steps; s++) {
    const u = s / steps;
    const w1 = Math.sin(u * style.waves * Math.PI * 2 + timeSec * style.speed + style.phase);
    const w2 = Math.sin(
      u * style.waves * 1.9 * Math.PI * 2 - timeSec * style.speed * 0.6 + style.phase,
    );
    const flow = w1 * 0.62 + w2 * 0.38;
    // The lane's center height (rest ± beat swing) with an organic horizontal ripple.
    const h = clamp(0, 1.1, centerHeight + flow * style.amp);
    ctx.lineTo(u * width, height - h * height);
  }
  ctx.lineTo(width, height + 2);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function paintBreathingLight({
  ctx,
  width,
  height,
  timeSec,
  playing,
  skin,
  frame,
}: BreathingLightPaintInput): void {
  ctx.clearRect(0, 0, width, height);

  const idleBreath = 0.5 + Math.sin(timeSec * 1.1) * 0.5;
  const colors = spectralLightColors({ accent: skin.accent, tones: skin.tones });
  const lanes = audioLanes(frame, BAND_LANES);
  const denom = Math.max(1, lanes.length - 1);

  lanes.forEach((lane, k) => {
    const style = laneStyle(k);
    // Soft-knee so only the biggest transients graze the ceiling.
    const level = lane.energy <= 0.72 ? lane.energy : 0.72 + (lane.energy - 0.72) * 0.45;
    // Playing: swing above/below this lane's resting height by how far its energy
    // sits from the AGC centre, scaled by the lane's own amplitude → uneven, layered
    // motion. Paused: settle to a gentle low breath at a fraction of the rest height.
    const centerHeight = playing
      ? style.rest + (level - LANE_CENTER) * style.react
      : style.rest * (0.4 + idleBreath * 0.12);
    const color = laneColor(colors, k / denom);
    paintLane(ctx, width, height, timeSec, centerHeight, color, style);
  });
}
