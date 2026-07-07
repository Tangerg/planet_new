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
// "per-instrument" (true stems aren't in the mix we get). More lanes = richer,
// layered translucent depth without muddying, once heights/opacity are scattered.
const BAND_LANES = 7;

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

// Low-discrepancy scatter in [0,1): a golden-ratio additive recurrence gives an even
// spread with no repetition for any lane count — better than a sine, which can settle
// into a short period. Different seeds give each lane independent characters.
const GOLDEN = 0.618033988749895;
function laneScatter(index: number, seed: number): number {
  const x = index * GOLDEN + seed;
  return x - Math.floor(x);
}

// Per-lane render params. `rest` = resting height and `react` = how hard the beat
// swings this lane — scattered independently, so some lanes are tall & calm and
// others low & jumpy (the "错落有致" layering). speed/waves/phase give each its own
// horizontal flow; alpha varies so the translucent layers build visible depth.
function laneStyle(index: number): LaneStyle {
  const vh = laneScatter(index, 0.35); // resting-height character
  const vr = laneScatter(index, 0.72); // reactivity character
  const va = laneScatter(index, 0.5); // opacity character
  return {
    speed: (0.5 + index * 0.2) * (index % 2 === 0 ? 1 : -1),
    waves: 1.1 + index * 0.42,
    amp: 0.05 + vh * 0.055,
    phase: index * 1.3,
    alpha: 0.19 + va * 0.16,
    react: 0.32 + vr * 0.78,
    rest: 0.14 + vh * 0.56,
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

  const rendered = lanes.map((lane, k) => {
    const style = laneStyle(k);
    // Soft-knee so only the biggest transients graze the ceiling.
    const level = lane.energy <= 0.72 ? lane.energy : 0.72 + (lane.energy - 0.72) * 0.45;
    // Playing: swing above/below this lane's resting height by how far its energy
    // sits from the AGC centre, scaled by the lane's own amplitude → uneven, layered
    // motion. Paused: settle to a gentle low breath at a fraction of the rest height.
    const centerHeight = playing
      ? style.rest + (level - LANE_CENTER) * style.react
      : style.rest * (0.4 + idleBreath * 0.12);
    return { style, centerHeight, color: laneColor(colors, k / denom) };
  });

  // Paint the tallest-resting lanes first (behind), shorter ones in front, so the
  // translucent layers read with depth. Sorting by the static rest height (not the
  // live one) keeps a stable draw order — no per-frame z-fighting flicker.
  rendered.sort((a, b) => b.style.rest - a.style.rest);
  for (const r of rendered) {
    paintLane(ctx, width, height, timeSec, r.centerHeight, r.color, r.style);
  }
}
