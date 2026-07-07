import { Hct, TonalPalette, argbFromHex, hexFromArgb } from "@material/material-color-utilities";

import { clamp } from "@shared/math";

import type { SpectrumProfile } from "./audio-spectrum";

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

// ── Material 3 tonal ramp (阶梯色) ────────────────────────────────────────────
// The visualiser is toned from the cover's source colour and stepped as an M3
// TonalPalette: one hue + chroma held constant, only the TONE varies. Tone is
// perceptually uniform (HCT ≈ L*), so the deep→bright steps look evenly spaced —
// unlike an HSL lightness ramp, which reads uneven and cheap. Chroma is clamped to
// a jewel range so a muted cover still shows colour and a neon one stays tasteful.
const RAMP_STEPS = 12; // finer sampling → smoother gradation across the ramp
const TONE_BASE = 28; // deepest rung (bar floor)
const TONE_RANGE = 52; // deep → bright span; wide for rich gradation, smoothly blended
const CHROMA_MIN = 22;
const CHROMA_MAX = 56;
const TONE_FALLBACK: HslColor = { h: 280, s: 40, l: 50 };

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

/** The source hex to tone from: the more saturated of the cover pair (tintA/tintB —
 *  when a real cover colour was extracted, both are it). The accent is a LAST resort,
 *  used only for a near-greyscale cover, so a vivid brand accent never hijacks the
 *  tone away from the artwork. */
function toneSourceHex(tintA: string, tintB: string, accent: string): string {
  const a = parseHexColor(tintA, { h: 300, s: 60, l: 40 });
  const b = parseHexColor(tintB, { h: 300, s: 70, l: 58 });
  const preferB = b.s >= a.s;
  const cover = preferB ? b : a;
  if (cover.s >= 12) return preferB ? tintB : tintA;
  return accent;
}

// TonalPalettes are keyed off the source colour; building one solves HCT, so cache
// per source (a track's cover is stable for its whole play).
const paletteCache = new Map<string, TonalPalette>();
function paletteFor(sourceHex: string): TonalPalette {
  const cached = paletteCache.get(sourceHex);
  if (cached) return cached;
  let palette: TonalPalette;
  try {
    const src = Hct.fromInt(argbFromHex(sourceHex));
    palette = TonalPalette.fromHueAndChroma(src.hue, clamp(CHROMA_MIN, CHROMA_MAX, src.chroma));
  } catch {
    palette = TonalPalette.fromHueAndChroma(300, 40);
  }
  paletteCache.set(sourceHex, palette);
  return palette;
}

/** One rung of the tonal ramp at position `at` (0 = deep base, 1 = bright crest).
 *  Louder passages lift the whole ramp a little (energy). Tone is rounded so the
 *  palette's per-tone cache hits and no HCT is solved on the hot path. */
function toneColor(palette: TonalPalette, at: number, energy: number): HslColor {
  const tone = Math.round(clamp(24, 92, TONE_BASE + clamp(0, 1, at) * TONE_RANGE + energy * 8));
  return parseHexColor(hexFromArgb(palette.tone(tone)), TONE_FALLBACK);
}

export function spectralLightColors({
  accent,
  tintA,
  tintB,
  profile,
}: {
  accent: string;
  tintA: string;
  tintB: string;
  profile: SpectrumProfile;
}): SpectralLightColors {
  const palette = paletteFor(toneSourceHex(tintA, tintB, accent));
  const low = clamp(0, 1, profile.low);
  const mid = clamp(0, 1, profile.mid);
  const peak = clamp(0, 1, profile.peak);
  const energy = clamp(0, 1, low * 0.5 + mid * 0.3 + peak * 0.2);

  const step = (at: number): HslColor => toneColor(palette, at, energy);
  const stops = Array.from({ length: RAMP_STEPS }, (_, index): SpectralColorStop => {
    const at = index / (RAMP_STEPS - 1);
    return { at, color: step(at), intensity: 1 };
  });

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
