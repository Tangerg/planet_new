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

// Number of soft light blobs sampled across the bar. Finer than the band count so
// the overlapping radials merge into one continuous, bleeding field ("晕开") with
// no seams or edges.
const FIELD_SAMPLES = 28;

/** Shortest-arc hue interpolation (handles the 360° seam the drift can introduce). */
function hueLerp(from: number, to: number, t: number): number {
  const delta = ((to - from + 540) % 360) - 180;
  return (from + delta * clamp(0, 1, t) + 360) % 360;
}

type SampledColor = { h: number; s: number; l: number; intensity: number };

/** Interpolate the temperature stop colour + intensity at position u∈[0,1]. */
function sampleStops(colors: SpectralPaintColors, u: number): SampledColor {
  const stops = colors.stops;
  const n = stops.length;
  if (n === 0) return { h: 280, s: 90, l: 56, intensity: 0 };
  if (n === 1) return { ...stops[0].color, intensity: stops[0].intensity };
  const x = clamp(0, 1, u) * (n - 1);
  const i = Math.min(n - 2, Math.floor(x));
  const t = clamp(0, 1, x - i);
  const lo = stops[i];
  const hi = stops[i + 1];
  return {
    h: hueLerp(lo.color.h, hi.color.h, t),
    s: lo.color.s + (hi.color.s - lo.color.s) * t,
    l: lo.color.l + (hi.color.l - lo.color.l) * t,
    intensity: lo.intensity + (hi.intensity - lo.intensity) * t,
  };
}

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

function paintAmbientWash(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: SpectralPaintColors,
  pulse: number,
): void {
  // A low, flat base so quiet passages still carry the cool→warm temperature field.
  ctx.fillStyle = stopsGradient(
    ctx,
    width,
    colors,
    (intensity) => 0.05 + pulse * 0.06 + intensity * 0.05,
  );
  ctx.fillRect(0, 0, width, height);
}

/**
 * The diffuse spectral field: a row of large, soft radial blooms — no edges, no
 * line. Each bleeds into its neighbours (additive) into one continuous cool→warm
 * haze that brightens and rises where its band is loud, and undulates on a slow
 * wave. This is the "晕开" render — ink-in-water rather than drawn shapes.
 */
function paintDiffuseField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number,
  bands: readonly number[],
  colors: SpectralPaintColors,
  pulse: number,
): void {
  // Radius comfortably exceeds both the sample spacing (so blobs merge sideways)
  // and the bar height (so each is a soft vertical glow, never a dot).
  const radius = Math.max((width / (FIELD_SAMPLES - 1)) * 2.4, height * 1.15);
  for (let i = 0; i < FIELD_SAMPLES; i++) {
    const u = i / (FIELD_SAMPLES - 1);
    const band = bands[Math.min(bands.length - 1, Math.floor(u * bands.length))] ?? 0;
    // Two travelling sines give the field a slow, churning wave motion.
    const wave =
      Math.sin(u * Math.PI * 3 + timeSec * 0.8) * 0.5 +
      Math.sin(u * Math.PI * 6 - timeSec * 1.25) * 0.3;
    const lift = clamp(0, 1, 0.2 + pulse * 0.28 + band * 0.72 + wave * 0.12 * (0.4 + band));
    const sample = sampleStops(colors, u);
    const color: HslColor = { h: sample.h, s: sample.s, l: sample.l };
    const x = u * width;
    // Hotspot sits near the floor and rises with energy; radius > height means the
    // glow fills the bar with a soft vertical falloff instead of a hard tongue.
    const cy = height * (1.02 - lift * 0.5);
    const alpha = (0.05 + lift * 0.5) * (0.45 + sample.intensity * 0.7);
    const bloom = ctx.createRadialGradient(x, cy, 0, x, cy, radius);
    bloom.addColorStop(0, hsla(color, alpha));
    bloom.addColorStop(0.5, hsla(color, alpha * 0.34));
    bloom.addColorStop(1, hsla(color, 0));
    ctx.fillStyle = bloom;
    ctx.fillRect(x - radius, 0, radius * 2, height);
  }
}

function paintCoreBloom(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dominant: HslColor,
  pulse: number,
  centerX: number,
  radius: number,
): void {
  // A broad travelling halo in the dominant pitch colour — the soft psychedelic core.
  const bloom = ctx.createRadialGradient(centerX, height * 0.68, 0, centerX, height * 0.68, radius);
  bloom.addColorStop(0, hsla(dominant, 0.1 + pulse * 0.34));
  bloom.addColorStop(0.45, hsla(dominant, 0.04 + pulse * 0.14));
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
  const coreRadius = Math.max(width * (0.5 + pulse * 0.22), height * 4);

  paintAmbientWash(ctx, width, height, colors, pulse);

  ctx.globalCompositeOperation = "lighter";
  paintDiffuseField(ctx, width, height, timeSec, frame.bands, colors, pulse);
  paintCoreBloom(ctx, width, height, colors.line, pulse, centerX, coreRadius);
  ctx.globalCompositeOperation = "source-over";
}
