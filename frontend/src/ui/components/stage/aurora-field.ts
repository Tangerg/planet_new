import { clamp } from "@shared/math";

import {
  audioLanes,
  hsla,
  type HslColor,
  type SpectralLightColors,
} from "@/model/audio-visualization";

import type { StageEffectInstance, StageFrameInput } from "./stage-effect";

// A fullscreen take on the player-bar waves: more, taller, layered bands.
const BANDS = 9;
const GOLDEN = 0.618033988749895;

/** Low-discrepancy scatter (see breathing-light-canvas) — even, non-repeating. */
function scatter(index: number, seed: number): number {
  const x = index * GOLDEN + seed;
  return x - Math.floor(x);
}

function laneColor(colors: SpectralLightColors, t: number): HslColor {
  const stops = colors.stops;
  if (stops.length === 0) return { h: 280, s: 40, l: 50 };
  const x = clamp(0, 1, t) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const a = stops[i].color;
  const b = stops[i + 1].color;
  return { h: a.h + (b.h - a.h) * f, s: a.s + (b.s - a.s) * f, l: a.l + (b.l - a.l) * f };
}

/**
 * Aurora stage: layered flowing ribbons filling the screen, each band swinging
 * around its own resting height with the beat (the same audio-lanes core and
 * scatter-based layering as the player-bar visualiser, scaled up). 2D canvas.
 */
export function createAuroraField(canvas: HTMLCanvasElement): StageEffectInstance {
  const ctx = canvas.getContext("2d");

  return {
    resize(_width: number, _height: number, dpr: number) {
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    draw({ width, height, timeSec, playing, frame, colors }: StageFrameInput) {
      if (!ctx) return;
      const base = colors.stops[0]?.color;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = base
        ? hsla({ h: base.h, s: Math.min(base.s, 50), l: Math.min(base.l, 7) }, 1)
        : "#06060a";
      ctx.fillRect(0, 0, width, height);

      const lanes = audioLanes(frame, BANDS);
      const denom = Math.max(1, lanes.length - 1);
      const idle = 0.14 + (0.5 + Math.sin(timeSec * 1.1) * 0.5) * 0.06;

      const rendered = lanes.map((lane, k) => {
        const vh = scatter(k, 0.35);
        const vr = scatter(k, 0.72);
        const va = scatter(k, 0.5);
        const energy = playing ? lane.energy : idle;
        const level = energy <= 0.72 ? energy : 0.72 + (energy - 0.72) * 0.45;
        const rest = 0.18 + vh * 0.5;
        const react = 0.4 + vr * 0.8;
        return {
          center: rest + (level - 0.5) * react,
          alpha: 0.15 + va * 0.14,
          waves: 1.1 + k * 0.5,
          speed: (0.4 + k * 0.16) * (k % 2 === 0 ? 1 : -1),
          amp: 0.03 + vh * 0.04,
          color: laneColor(colors, k / denom),
        };
      });

      // Tall-resting bands behind, shorter in front → layered depth (stable order).
      rendered.sort((a, b) => b.center - a.center);
      ctx.globalCompositeOperation = "lighter";
      for (const r of rendered) {
        ctx.globalAlpha = r.alpha;
        ctx.fillStyle = hsla(r.color, 1);
        ctx.beginPath();
        ctx.moveTo(0, height + 2);
        const steps = 96;
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const w1 = Math.sin(u * r.waves * Math.PI * 2 + timeSec * r.speed);
          const w2 = Math.sin(u * r.waves * 1.9 * Math.PI * 2 - timeSec * r.speed * 0.6);
          const flow = w1 * 0.62 + w2 * 0.38;
          const h = clamp(0, 1.1, r.center + flow * r.amp);
          ctx.lineTo(u * width, height - h * height);
        }
        ctx.lineTo(width, height + 2);
        ctx.closePath();
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    },
  };
}
