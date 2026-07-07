import { clamp } from "@shared/math";

import type { SpectralColorSignature } from "./audio-color-signature";
import { FFT_BYTE_MAX, normalizeFftByte, type SpectrumProfile } from "./audio-spectrum";

export type HslColor = {
  h: number;
  s: number;
  l: number;
};

export type SpectralColorStop = {
  at: number;
  color: HslColor;
  intensity: number;
};

export type SpectralLightColors = {
  bass: HslColor;
  warmth: HslColor;
  body: HslColor;
  spark: HslColor;
  air: HslColor;
  line: HslColor;
  stops: readonly SpectralColorStop[];
};

// ── Cover-toned ramp (阶梯色) ─────────────────────────────────────────────────
// The whole visualiser is toned from the artwork's own colour: one cohesive
// monochromatic / analogous ramp, deep at the base and bright at the crest. The
// hue drifts only slightly across the ramp (±HALF_SPREAD) so it reads as a single
// colour family lifted from the cover — a graded scale, never a rainbow.
const HUE_SPREAD = 26; // total analogous drift across the ramp (±13°) — kept tight

function parseHexColor(hex: string, fallback: HslColor): HslColor {
  const value = hex.trim().replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return fallback;
  const num = Number.parseInt(value, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) return { h: 280, s: 0, l: lightness * 100 };

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  return {
    h: (hue * 60 + 360) % 360,
    s: saturation * 100,
    l: lightness * 100,
  };
}

type CoverTone = { hue: number; sat: number };

/** Pick the tone-setting hue/saturation from the cover's colour pair (falling back
 *  to the accent if the artwork is basically greyscale). The most saturated of the
 *  candidates wins, so the ramp keys off the artwork's most characterful colour. */
function coverTone(tintA: string, tintB: string, accent: string): CoverTone {
  const candidates = [
    parseHexColor(tintB, { h: 300, s: 70, l: 58 }),
    parseHexColor(tintA, { h: 300, s: 62, l: 40 }),
    parseHexColor(accent, { h: 300, s: 70, l: 55 }),
  ];
  const pick = candidates.reduce((best, c) => (c.s > best.s ? c : best), candidates[0]);
  return { hue: pick.h, sat: clamp(46, 80, pick.s) };
}

/** One rung of the cover ramp at position `at` (0 = deep base, 1 = bright crest).
 *  `drift` is the painter's slow shimmer; both it and the ±spread stay small so the
 *  colour never leaves the cover's family. */
function rampColor(at: number, tone: CoverTone, energy: number, drift: number): HslColor {
  const t = clamp(0, 1, at);
  const mid = 0.5 - Math.abs(t - 0.5); // 0 at the ends, 0.5 in the middle
  return {
    h: (tone.hue + (t - 0.5) * HUE_SPREAD + drift + 360) % 360,
    s: clamp(42, 84, tone.sat + mid * 10),
    l: clamp(24, 68, 28 + t * 30 + energy * 9),
  };
}

function profileFallbackSignature(profile: SpectrumProfile): SpectralColorSignature {
  return {
    bass: profile.low * FFT_BYTE_MAX,
    lowMid: ((profile.low + profile.mid) / 2) * FFT_BYTE_MAX,
    mid: profile.mid * FFT_BYTE_MAX,
    highMid: ((profile.mid + profile.high) / 2) * FFT_BYTE_MAX,
    air: profile.high * FFT_BYTE_MAX,
    lanes: [
      profile.low * FFT_BYTE_MAX,
      ((profile.low + profile.mid) / 2) * FFT_BYTE_MAX,
      profile.mid * FFT_BYTE_MAX,
      ((profile.mid + profile.high) / 2) * FFT_BYTE_MAX,
      profile.high * FFT_BYTE_MAX,
    ],
    centroid: (profile.high * 0.68 + profile.mid * 0.32) * FFT_BYTE_MAX,
    contrast: profile.peak * FFT_BYTE_MAX,
  };
}

export function spectralLightColors({
  accent,
  tintA,
  tintB,
  profile,
  signature,
  hueDrift = 0,
}: {
  accent: string;
  tintA: string;
  tintB: string;
  profile: SpectrumProfile;
  signature?: SpectralColorSignature;
  /** Slow time hue rotation from the painter (subtle shimmer within the family). */
  hueDrift?: number;
}): SpectralLightColors {
  const color = signature ?? profileFallbackSignature(profile);
  const tone = coverTone(tintA, tintB, accent);

  const low = clamp(0, 1, profile.low);
  const mid = clamp(0, 1, profile.mid);
  const peak = clamp(0, 1, profile.peak);
  const energy = clamp(0, 1, low * 0.5 + mid * 0.3 + peak * 0.2);

  const lanes = color.lanes.length
    ? color.lanes
    : [color.bass, color.lowMid, color.mid, color.highMid, color.air];
  const stops = lanes.map((value, index): SpectralColorStop => {
    const at = lanes.length === 1 ? 0.5 : index / (lanes.length - 1);
    return {
      at,
      color: rampColor(at, tone, energy, hueDrift),
      intensity: clamp(0, 1, normalizeFftByte(value)),
    };
  });

  const step = (at: number): HslColor => rampColor(at, tone, energy, hueDrift);
  return {
    bass: step(0),
    warmth: step(0.28),
    body: step(0.5),
    spark: step(0.72),
    air: step(1),
    line: step(0.6),
    stops,
  };
}

export function hsla(color: HslColor, alpha: number): string {
  return `hsla(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%, ${clamp(0, 1, alpha).toFixed(3)})`;
}
