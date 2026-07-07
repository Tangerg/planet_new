import { clamp } from "@shared/math";

import { audioLanes, hsla, type HslColor } from "@/model/audio-visualization";
import { beatEnvelope, type CoverParticles } from "@/model/stage-particles";

import type { StageEffectInstance, StageFrameInput } from "./stage-effect";

// The cover cloud spans this fraction of the smaller viewport axis at rest; beats
// push particles out past it. Bands: reuse the audio-lanes core (1 raw + BANDS).
const COVER_EXTENT = 0.7;
const BANDS = 7;
// Trail persistence: each frame paints a translucent cover-tinted wash instead of a
// hard clear, so particles smear into soft light (the "bloom" feel without WebGL).
const BG_FADE = 0.24;
const DRIFT = 0.03; // idle drift, as a fraction of the cloud extent
const FOLLOW = 0.22; // spring toward the target position → organic lag/inertia
// Point size (CSS px): base + brighter cover pixels + its band's energy + beats.
const POINT = 1.3;
const POINT_LUMA = 1.7;
const POINT_POP = 1.8;
const POINT_BEAT = 2.4;

function darkTint(color: HslColor | undefined): string {
  if (!color) return `rgba(6, 6, 9, ${BG_FADE})`;
  return hsla({ h: color.h, s: Math.min(color.s, 60), l: Math.min(color.l, 9) }, BG_FADE);
}

/**
 * Particle stage: the album cover, sampled into a cloud of points, breathing and
 * bursting with the music. Each particle is coloured by its cover pixel; its band
 * (chosen by distance from centre — bass in, treble out) and the beat push it out
 * and brighten it. Additive blending over trailing washes reads as glowing dust.
 * Inspired by Mineradio's cover-particle visual, adapted to the 2D canvas stack.
 */
export function createParticleField(): StageEffectInstance {
  let seeds: CoverParticles | null = null;
  let px = new Float32Array(0);
  let py = new Float32Array(0);
  let colorStr: string[] = [];
  let angle = 0;
  let energyMean = 0.5;
  let beat = 0;

  function init(p: CoverParticles, width: number, height: number): void {
    seeds = p;
    px = new Float32Array(p.count);
    py = new Float32Array(p.count);
    colorStr = Array.from({ length: p.count }, () => "");
    const cx = width / 2;
    const cy = height / 2;
    const extent = Math.min(width, height) * COVER_EXTENT;
    for (let i = 0; i < p.count; i++) {
      px[i] = cx + p.nx[i] * extent;
      py[i] = cy + p.ny[i] * extent;
      // Precompute the colour string once so the hot loop only varies alpha (numeric)
      // — no per-particle string allocation each frame.
      colorStr[i] =
        `rgb(${Math.round(p.r[i] * 255)},${Math.round(p.g[i] * 255)},${Math.round(p.b[i] * 255)})`;
    }
  }

  return {
    draw({
      ctx,
      width,
      height,
      timeSec,
      dtSec,
      playing,
      frame,
      colors,
      particles,
    }: StageFrameInput) {
      if (particles && particles !== seeds) init(particles, width, height);

      // Trailing wash (cover-tinted) instead of a hard clear → soft light trails.
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = darkTint(colors.stops[0]?.color);
      ctx.fillRect(0, 0, width, height);

      if (!seeds) return;

      const lanes = audioLanes(frame, BANDS);
      const overall = playing ? lanes[0].energy : 0.14 + 0.05 * Math.sin(timeSec * 0.8);
      // Slow mean → a beat is energy rising above its recent average; env smooths it.
      energyMean += (overall - energyMean) * 0.03;
      const pulse = Math.max(0, overall - energyMean) * 3.2;
      beat = beatEnvelope(beat, clamp(0, 1.4, pulse));

      angle += dtSec * (0.05 + overall * 0.12);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const cx = width / 2;
      const cy = height / 2;
      const extent = Math.min(width, height) * COVER_EXTENT;
      const driftAmt = DRIFT * extent * (playing ? 0.5 + overall : 0.5);

      ctx.globalCompositeOperation = "lighter";
      const n = seeds.count;
      for (let i = 0; i < n; i++) {
        const hx = seeds.nx[i];
        const hy = seeds.ny[i];
        // Slow whole-cloud rotation.
        const rx = hx * cosA - hy * sinA;
        const ry = hx * sinA + hy * cosA;
        const rad = Math.sqrt(rx * rx + ry * ry); // 0..~0.7 (aspect-corrected home)
        const band = lanes[1 + Math.min(BANDS - 1, Math.floor((rad / 0.72) * BANDS))].energy;
        const s = seeds.seed[i];
        const dx = Math.sin(timeSec * 0.7 + s * 6.283) * driftAmt;
        const dy = Math.cos(timeSec * 0.6 + s * 6.283) * driftAmt;
        // Push out from centre by the overall breath, this particle's band, and beats.
        const push = 1 + (overall - 0.5) * 0.4 + (band - 0.5) * 0.85 + beat * 1.0 + pulse * 0.5;
        const tx = cx + rx * push * extent + dx;
        const ty = cy + ry * push * extent + dy;
        px[i] += (tx - px[i]) * FOLLOW;
        py[i] += (ty - py[i]) * FOLLOW;

        const bright = clamp(0.05, 1, 0.26 + seeds.luma[i] * 0.5 + band * 0.5 + beat * 0.5);
        const size = POINT + seeds.luma[i] * POINT_LUMA + band * POINT_POP + beat * POINT_BEAT;
        ctx.globalAlpha = bright;
        ctx.fillStyle = colorStr[i];
        ctx.fillRect(px[i], py[i], size, size);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    },
  };
}
