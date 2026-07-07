import { clamp } from "@shared/math";

import {
  hsla,
  spectralLightColors,
  type AudioLightFrame,
  type HslColor,
} from "@/model/audio-visualization";

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

// Flame/wave layers, back → front. Stacked with additive ("lighter") blending so
// the shared base burns bright (all overlap) and the tips fade (one layer) — the
// flame falloff comes for free. Each drifts at its own speed/phase for a churning,
// psychedelic motion; `reactive` is how hard the band energy throws the tongues up.
// More layers at lower per-layer alpha means their differing crest heights feather
// into one another, so the aggregate top edge reads soft instead of a hard line.
type FlameLayer = {
  waves: number;
  speed: number;
  amp: number;
  phase: number;
  alpha: number;
  reactive: number;
};

const FLAME_LAYERS: readonly FlameLayer[] = [
  { waves: 1.3, speed: 0.5, amp: 0.62, phase: 0, alpha: 0.13, reactive: 0.6 },
  { waves: 1.8, speed: -0.8, amp: 0.5, phase: 1.1, alpha: 0.14, reactive: 0.72 },
  { waves: 2.3, speed: 1.0, amp: 0.44, phase: 2.3, alpha: 0.14, reactive: 0.82 },
  { waves: 2.9, speed: -1.3, amp: 0.36, phase: 3.4, alpha: 0.13, reactive: 0.9 },
  { waves: 3.4, speed: 1.5, amp: 0.3, phase: 4.5, alpha: 0.12, reactive: 0.96 },
  { waves: 4.1, speed: -1.9, amp: 0.24, phase: 5.6, alpha: 0.1, reactive: 1.0 },
];

function stopsGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  colors: SpectralPaintColors,
  alpha: (intensity: number) => number,
): CanvasGradient {
  // Cool (bass) on the left → warm (treble) on the right.
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  for (const stop of colors.stops) {
    gradient.addColorStop(clamp(0, 1, stop.at), hsla(stop.color, alpha(stop.intensity)));
  }
  return gradient;
}

/** Flame-tongue height (0..~1.2) at horizontal position u∈[0,1]. */
function flameHeight(
  u: number,
  timeSec: number,
  bands: readonly number[],
  pulse: number,
  layer: FlameLayer,
): number {
  const band = bands[Math.min(bands.length - 1, Math.floor(u * bands.length))] ?? 0;
  const w1 = Math.sin(u * layer.waves * Math.PI * 2 + timeSec * layer.speed + layer.phase);
  const w2 = Math.sin(
    u * layer.waves * 1.9 * Math.PI * 2 - timeSec * layer.speed * 0.6 + layer.phase,
  );
  const flow = w1 * 0.62 + w2 * 0.38;
  const base = 0.14 + pulse * 0.22;
  const tongue = flow * layer.amp * (0.26 + band * 0.95);
  return clamp(0, 1.25, base + band * layer.reactive + tongue);
}

function paintFlameLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number,
  bands: readonly number[],
  colors: SpectralPaintColors,
  pulse: number,
  layer: FlameLayer,
): void {
  ctx.fillStyle = stopsGradient(ctx, width, colors, (intensity) => layer.alpha * (0.4 + intensity));
  ctx.beginPath();
  ctx.moveTo(0, height + 2);
  const steps = 80;
  for (let s = 0; s <= steps; s++) {
    const u = s / steps;
    const h = flameHeight(u, timeSec, bands, pulse, layer);
    ctx.lineTo(u * width, height - h * height);
  }
  ctx.lineTo(width, height + 2);
  ctx.closePath();
  ctx.fill();
}

function paintAmbientWash(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: SpectralPaintColors,
  pulse: number,
): void {
  // A low base so quiet passages still carry the cool→warm temperature field.
  ctx.fillStyle = stopsGradient(
    ctx,
    width,
    colors,
    (intensity) => 0.05 + pulse * 0.06 + intensity * 0.05,
  );
  ctx.fillRect(0, 0, width, height);
}

function paintBloom(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dominant: HslColor,
  pulse: number,
  centerX: number,
  radius: number,
): void {
  // A travelling neon bloom in the dominant pitch colour — the psychedelic core.
  const bloom = ctx.createRadialGradient(centerX, height * 0.72, 0, centerX, height * 0.72, radius);
  bloom.addColorStop(0, hsla(dominant, 0.12 + pulse * 0.4));
  bloom.addColorStop(0.42, hsla(dominant, 0.05 + pulse * 0.16));
  bloom.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, width, height);
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
  // Slow ±16° hue shimmer keeps the sweep alive without leaving the neon zone.
  const hueDrift = Math.sin(timeSec * 0.06) * 16;

  const colors = spectralLightColors({
    accent: skin.accent,
    tintA: skin.tintA,
    tintB: skin.tintB,
    profile: frame.profile,
    signature: frame.signature,
    hueDrift,
  });

  const drift = Math.sin(timeSec * 0.19) * 0.16;
  const centerX = width * (0.5 + drift);
  const radius = Math.max(width * (0.5 + pulse * 0.22), height * 4);

  paintAmbientWash(ctx, width, height, colors, pulse);

  ctx.globalCompositeOperation = "lighter";
  paintBloom(ctx, width, height, colors.line, pulse, centerX, radius);
  for (const layer of FLAME_LAYERS) {
    paintFlameLayer(ctx, width, height, timeSec, frame.bands, colors, pulse, layer);
  }
  ctx.globalCompositeOperation = "source-over";
}
