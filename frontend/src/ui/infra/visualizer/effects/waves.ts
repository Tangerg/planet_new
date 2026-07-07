import { clamp } from "@shared/math";

import {
  hsla,
  spectralLightColors,
  type HslColor,
  type SpectralLightColors,
} from "@/model/audio-visualization";

import { coverColors } from "../cover";
import type { VisualEffect, VisualFrame } from "../engine";

// Low-discrepancy scatter in [0,1): a golden-ratio additive recurrence gives an even
// spread with no repetition for any lane count. Different seeds → independent lane
// characters, so the stack reads as uneven, layered ribbons ("错落有致").
const GOLDEN = 0.618033988749895;
function scatter(index: number, seed: number): number {
  const x = index * GOLDEN + seed;
  return x - Math.floor(x);
}

// The AGC centres every band ≈ this; a lane at its running level rests here and the
// beat swings it above/below.
const LANE_CENTER = 0.5;

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

type LaneStyle = {
  speed: number;
  waves: number;
  amp: number;
  phase: number;
  alpha: number;
  react: number;
  rest: number;
};

// Per-lane render params scattered independently so some lanes are tall & calm and
// others low & jumpy; speed/waves/phase give each its own horizontal flow.
function laneStyle(index: number): LaneStyle {
  const vh = scatter(index, 0.35);
  const vr = scatter(index, 0.72);
  const va = scatter(index, 0.5);
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

/**
 * Waves: layered flowing ribbons — one per band around the raw/overall backbone,
 * each swinging around its own resting height with the beat. Size-adaptive: this is
 * both the compact player-bar visual and the fullscreen "aurora". 2D canvas.
 */
export const wavesEffect: VisualEffect = {
  id: "waves",
  labelKey: "stage.effect.waves",
  create(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");

    function paintLane(
      width: number,
      height: number,
      timeSec: number,
      centerHeight: number,
      color: HslColor,
      style: LaneStyle,
    ): void {
      if (!ctx) return;
      ctx.globalAlpha = style.alpha;
      ctx.fillStyle = hsla(color, 1);
      ctx.beginPath();
      ctx.moveTo(0, height + 2);
      const steps = 88;
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const w1 = Math.sin(u * style.waves * Math.PI * 2 + timeSec * style.speed + style.phase);
        const w2 = Math.sin(
          u * style.waves * 1.9 * Math.PI * 2 - timeSec * style.speed * 0.6 + style.phase,
        );
        const flow = w1 * 0.62 + w2 * 0.38;
        const h = clamp(0, 1.1, centerHeight + flow * style.amp);
        ctx.lineTo(u * width, height - h * height);
      }
      ctx.lineTo(width, height + 2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    return {
      resize(_width: number, _height: number, dpr: number) {
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      },

      draw({ width, height, timeSec, playing, audio, image, accent }: VisualFrame) {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        // The drawing side fetches its own cover palette (memoized in spectralLightColors).
        const colors = spectralLightColors({ accent, tones: coverColors(image) ?? [accent] });
        const idleBreath = 0.5 + Math.sin(timeSec * 1.1) * 0.5;
        // Lane 0 is the raw/overall backbone; lanes 1..N are the frequency bands.
        const levels = [audio.overall, ...audio.bands];
        const denom = Math.max(1, levels.length - 1);

        const rendered = levels.map((energy, k) => {
          const style = laneStyle(k);
          const level = energy <= 0.72 ? energy : 0.72 + (energy - 0.72) * 0.45;
          const centerHeight = playing
            ? style.rest + (level - LANE_CENTER) * style.react
            : style.rest * (0.4 + idleBreath * 0.12);
          return { style, centerHeight, color: laneColor(colors, k / denom) };
        });

        // Tall-resting lanes behind, shorter in front → layered depth (stable order).
        // Plain source-over (not additive): the bar sits on a light frost where
        // additive would blow out to white; translucent hills read the same on black.
        rendered.sort((a, b) => b.style.rest - a.style.rest);
        for (const r of rendered) {
          paintLane(width, height, timeSec, r.centerHeight, r.color, r.style);
        }
      },
    };
  },
};
