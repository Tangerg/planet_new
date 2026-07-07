import { clamp } from "@shared/math";

import { hsla, spectralLightColors, type AudioLightFrame } from "@/model/audio-visualization";

export type BreathingLightSkin = {
  accent: string;
  tintA: string;
  tintB: string;
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

// Translucent wave layers, back → front. Alpha-blended (NOT additive): additive
// summed cool+warm into a muddy brown wash — plain alpha keeps the vertical heat
// gradient clean. A few layers at low opacity build a soft, feathered crest where
// their differing heights overlap.
type WaveLayer = {
  waves: number;
  speed: number;
  amp: number;
  phase: number;
  alpha: number;
  reactive: number;
};

const WAVE_LAYERS: readonly WaveLayer[] = [
  { waves: 1.4, speed: 0.55, amp: 0.5, phase: 0, alpha: 0.22, reactive: 0.62 },
  { waves: 2.0, speed: -0.85, amp: 0.42, phase: 1.6, alpha: 0.24, reactive: 0.78 },
  { waves: 2.7, speed: 1.15, amp: 0.34, phase: 3.2, alpha: 0.26, reactive: 0.9 },
  { waves: 3.5, speed: -1.5, amp: 0.26, phase: 4.8, alpha: 0.26, reactive: 1.0 },
];

/** Vertical heat ramp: cool at the base (y = height) → warm at the top (y = 0).
 *  Colour depends only on height, so a tall wave reaches the warm stops at its
 *  crest while a short one stays cool near the floor. Full-alpha stops — layer
 *  translucency is applied by the caller via globalAlpha, keeping colours clean. */
function temperatureGradient(
  ctx: CanvasRenderingContext2D,
  height: number,
  colors: SpectralPaintColors,
): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, height, 0, 0);
  for (const stop of colors.stops) {
    gradient.addColorStop(clamp(0, 1, stop.at), hsla(stop.color, 1));
  }
  return gradient;
}

/** Wave/flame crest height (0..~1.2) at horizontal position u∈[0,1]. */
function waveHeight(
  u: number,
  timeSec: number,
  bands: readonly number[],
  pulse: number,
  layer: WaveLayer,
): number {
  const band = bands[Math.min(bands.length - 1, Math.floor(u * bands.length))] ?? 0;
  const w1 = Math.sin(u * layer.waves * Math.PI * 2 + timeSec * layer.speed + layer.phase);
  const w2 = Math.sin(
    u * layer.waves * 1.9 * Math.PI * 2 - timeSec * layer.speed * 0.6 + layer.phase,
  );
  const flow = w1 * 0.62 + w2 * 0.38;
  const base = 0.12 + pulse * 0.2;
  const tongue = flow * layer.amp * (0.26 + band * 0.95);
  return clamp(0, 1.2, base + band * layer.reactive + tongue);
}

function paintWaveLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number,
  bands: readonly number[],
  colors: SpectralPaintColors,
  pulse: number,
  layer: WaveLayer,
): void {
  ctx.globalAlpha = layer.alpha;
  ctx.fillStyle = temperatureGradient(ctx, height, colors);
  ctx.beginPath();
  ctx.moveTo(0, height + 2);
  const steps = 96;
  for (let s = 0; s <= steps; s++) {
    const u = s / steps;
    const h = waveHeight(u, timeSec, bands, pulse, layer);
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
  const pulse = playing
    ? Math.max(frame.energy, 0.14 + idleBreath * 0.18)
    : 0.06 + idleBreath * 0.05;

  const colors = spectralLightColors({
    accent: skin.accent,
    tintA: skin.tintA,
    tintB: skin.tintB,
    profile: frame.profile,
  });

  // Plain alpha compositing (no additive) so the vertical cool→warm gradient stays
  // clean instead of summing into a muddy wash.
  for (const layer of WAVE_LAYERS) {
    paintWaveLayer(ctx, width, height, timeSec, frame.bands, colors, pulse, layer);
  }
}
