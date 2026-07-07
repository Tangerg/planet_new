import { clamp } from "@shared/math";

import {
  hsla,
  spectralLightColors,
  type AudioLightFrame,
  type HslColor,
} from "@/model/audio-visualization";

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

type SpectralPaintColors = ReturnType<typeof spectralLightColors>;

// One lane per frequency band, back → front = low → high (bass/kick → air/cymbals):
// a band-split "multi-track" visualiser (true per-instrument needs stems we don't
// have; frequency bands are the standard real-time proxy). Each lane's HEIGHT tracks
// only its own band's energy, so lanes pulse to different parts of the mix; each is
// filled with its own colour sampled from the cover ramp (deep→bright) and flows at
// its own speed/phase. LANE count == band count == "波的数量".
type Lane = {
  speed: number;
  waves: number;
  amp: number;
  phase: number;
  alpha: number;
  reactive: number;
  base: number;
};

const LANES: readonly Lane[] = [
  { speed: 0.7, waves: 1.3, amp: 0.14, phase: 0, alpha: 0.36, reactive: 0.6, base: 0.14 },
  { speed: -1.0, waves: 1.7, amp: 0.14, phase: 1.0, alpha: 0.35, reactive: 0.62, base: 0.13 },
  { speed: 1.3, waves: 2.1, amp: 0.13, phase: 2.1, alpha: 0.34, reactive: 0.64, base: 0.12 },
  { speed: -1.7, waves: 2.5, amp: 0.13, phase: 3.2, alpha: 0.33, reactive: 0.66, base: 0.12 },
  { speed: 2.1, waves: 3.0, amp: 0.12, phase: 4.3, alpha: 0.32, reactive: 0.68, base: 0.11 },
  { speed: -2.6, waves: 3.5, amp: 0.12, phase: 5.4, alpha: 0.31, reactive: 0.7, base: 0.11 },
];

/** Mean energy of the frequency band assigned to lane `i` of `count`. */
function laneEnergy(bands: readonly number[], i: number, count: number): number {
  const per = bands.length / count;
  const start = Math.floor(i * per);
  const end = Math.max(start + 1, Math.min(bands.length, Math.floor((i + 1) * per)));
  let sum = 0;
  for (let b = start; b < end; b++) sum += bands[b] ?? 0;
  return sum / (end - start);
}

/** Sample the cover tonal ramp at position t∈[0,1] (deep → bright). */
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

function paintLane(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number,
  energy: number,
  color: HslColor,
  lane: Lane,
): void {
  // Soft-knee limiter: linear (punchy dynamics) below the knee, gently compressed
  // above so only the biggest transients graze the ceiling.
  const level = energy <= 0.72 ? energy : 0.72 + (energy - 0.72) * 0.45;
  ctx.globalAlpha = lane.alpha;
  ctx.fillStyle = hsla(color, 1);
  ctx.beginPath();
  ctx.moveTo(0, height + 2);
  const steps = 80;
  for (let s = 0; s <= steps; s++) {
    const u = s / steps;
    const w1 = Math.sin(u * lane.waves * Math.PI * 2 + timeSec * lane.speed + lane.phase);
    const w2 = Math.sin(
      u * lane.waves * 1.9 * Math.PI * 2 - timeSec * lane.speed * 0.6 + lane.phase,
    );
    const flow = w1 * 0.62 + w2 * 0.38;
    // A steady baseline so the lane keeps a consistent height; its band pushes the
    // peak up from it (level·reactive), and the flow gives an organic ripple.
    const h = clamp(0, 1.05, lane.base + level * lane.reactive + flow * lane.amp * (0.3 + level));
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

  const n = LANES.length;
  for (let i = 0; i < n; i++) {
    // Each lane reacts to its own band; idle keeps a gentle breath when paused.
    const energy = playing ? laneEnergy(frame.bands, i, n) : idle;
    paintLane(ctx, width, height, timeSec, energy, laneColor(colors, i / (n - 1)), LANES[i]);
  }
}
