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
  reactive: number;
  base: number;
};

// Per-lane flow/render params, derived from the lane's position so it scales to any
// lane count. Back (raw/low) sits a touch taller & more opaque; front (high) is
// thinner & more reactive. Each flows at its own speed/phase for a churning stack.
function laneStyle(index: number, total: number): LaneStyle {
  const t = total > 1 ? index / (total - 1) : 0;
  return {
    speed: (0.7 + index * 0.32) * (index % 2 === 0 ? 1 : -1),
    waves: 1.2 + index * 0.38,
    amp: 0.15 - t * 0.04,
    phase: index * 1.1,
    alpha: 0.36 - t * 0.07,
    reactive: 0.56 + t * 0.16,
    base: 0.15 - t * 0.05,
  };
}

function paintLane(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number,
  energy: number,
  color: HslColor,
  style: LaneStyle,
): void {
  // Soft-knee limiter: linear (punchy dynamics) below the knee, gently compressed
  // above so only the biggest transients graze the ceiling.
  const level = energy <= 0.72 ? energy : 0.72 + (energy - 0.72) * 0.45;
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
    // A steady baseline so the lane keeps a consistent height; its band pushes the
    // peak up from it (level·reactive), and the flow gives an organic ripple.
    const h = clamp(
      0,
      1.05,
      style.base + level * style.reactive + flow * style.amp * (0.3 + level),
    );
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
  const idle = 0.06 + idleBreath * 0.05;
  const colors = spectralLightColors({ accent: skin.accent, tones: skin.tones });
  const lanes = audioLanes(frame, BAND_LANES);
  const denom = Math.max(1, lanes.length - 1);

  lanes.forEach((lane, k) => {
    // Each lane reacts to its own band; idle keeps a gentle breath when paused.
    const energy = playing ? lane.energy : idle;
    const color = laneColor(colors, k / denom);
    paintLane(ctx, width, height, timeSec, energy, color, laneStyle(k, lanes.length));
  });
}
