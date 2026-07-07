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

// ── Left-to-right generated temperature spectrum ─────────────────────────────
// The hue is generated purely from horizontal position and sweeps EVENLY across a
// wide arc — teal → blue → violet → magenta → rose → red → amber-gold — so no
// single family (the cheap blue/purple) dominates; every colour gets equal width.
// Pitch → temperature still holds spatially (LOW/left = cool teal, HIGH/right =
// warm gold). A gold warm end + jewel (not fluorescent) saturation keep it premium.
const COOL_HUE = 190;
const WARM_HUE = 400; // wraps past 360 → 40° (amber-gold); span is even across x
const HUE_SPAN = WARM_HUE - COOL_HUE;
// Jewel-tone base saturation — rich but restrained; music energy lifts it a little,
// never to fluorescent.
const NEON_SAT = 66;

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

function blendHue(from: number, to: number, amount: number): number {
  const delta = ((to - from + 540) % 360) - 180;
  return (from + delta * clamp(0, 1, amount) + 360) % 360;
}

/** Frequency position (0 = lowest/cool, 1 = highest/warm) → neon temperature hue.
 *  `drift` is a slow time rotation the painter feeds in for the psychedelic shimmer. */
function temperatureHue(at: number, drift: number): number {
  return (COOL_HUE + clamp(0, 1, at) * HUE_SPAN + drift + 720) % 360;
}

/** Signature centroid → its position on the cool→warm axis (the "dominant pitch"). */
function centroidPosition(signature: SpectralColorSignature): number {
  return normalizeFftByte(signature.centroid);
}

type NeonColorOptions = {
  /** Position on the cool→warm frequency axis. */
  at: number;
  /** Raw FFT byte energy for this band (drives saturation + lightness). */
  value: number;
  /** Local spectral flux (band vs neighbours) — adds shimmer/lift. */
  flux: number;
  /** Overall track energy (lifts lightness so louder = more radiant). */
  energy: number;
  /** Slow time hue rotation (psychedelic drift). */
  drift: number;
  /** Track accent hue, mixed in only when idle so a paused bar keeps its identity. */
  accentHue: number;
  /** How much the accent bends the temperature hue (0 when playing = pure spectrum). */
  accentPull: number;
};

function neonColor({
  at,
  value,
  flux,
  energy,
  drift,
  accentHue,
  accentPull,
}: NeonColorOptions): HslColor {
  const norm = normalizeFftByte(value);
  const hue = blendHue(temperatureHue(at, drift), accentHue, accentPull);
  return {
    h: hue,
    // Restrained jewel saturation (never fluorescent) + deeper lightness so the
    // additive layers stack into rich colour instead of blowing out to candy/white.
    s: clamp(46, 82, NEON_SAT + norm * 9 + flux * 10),
    l: clamp(32, 58, 37 + norm * 15 + energy * 8 + flux * 6),
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

function spectralStops({
  signature,
  energy,
  drift,
  accentHue,
  accentPull,
}: {
  signature: SpectralColorSignature;
  energy: number;
  drift: number;
  accentHue: number;
  accentPull: number;
}): SpectralColorStop[] {
  const lanes = signature.lanes.length
    ? signature.lanes
    : [signature.bass, signature.lowMid, signature.mid, signature.highMid, signature.air];
  return lanes.map((value, index): SpectralColorStop => {
    const at = lanes.length === 1 ? 0.5 : index / (lanes.length - 1);
    const previous = lanes[Math.max(0, index - 1)] ?? value;
    const next = lanes[Math.min(lanes.length - 1, index + 1)] ?? value;
    const flux = normalizeFftByte(Math.abs(next - previous));
    return {
      at,
      color: neonColor({ at, value, flux, energy, drift, accentHue, accentPull }),
      intensity: clamp(0, 1, normalizeFftByte(value) + flux * 0.4),
    };
  });
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
  /** Slow time hue rotation from the painter (psychedelic shimmer). */
  hueDrift?: number;
}): SpectralLightColors {
  const color = signature ?? profileFallbackSignature(profile);
  const active = profile.active;

  const low = clamp(0, 1, profile.low);
  const mid = clamp(0, 1, profile.mid);
  const peak = clamp(0, 1, profile.peak);
  const energy = clamp(0, 1, low * 0.5 + mid * 0.3 + peak * 0.2);

  // Accent identity bleeds in only when idle; when playing the colour is pure
  // spectrum temperature (the bar reflects the MUSIC's pitch, not the album).
  const accentHsl = parseHexColor(accent, { h: 300, s: 90, l: 58 });
  const tintAHsl = parseHexColor(tintA, { h: 200, s: 88, l: 56 });
  const tintBHsl = parseHexColor(tintB, { h: 330, s: 90, l: 60 });
  const idleHue = blendHue(tintAHsl.h, tintBHsl.h, 0.5);
  const accentHue = active ? accentHsl.h : idleHue;
  const accentPull = active ? 0 : 0.55;

  const centroid = centroidPosition(color);
  const contrastFlux = normalizeFftByte(color.contrast);
  const neon = (at: number, value: number, flux = contrastFlux): HslColor =>
    neonColor({ at, value, flux, energy, drift: hueDrift, accentHue, accentPull });

  return {
    // Cool end.
    bass: neon(0.04, color.bass),
    warmth: neon(0.26, color.lowMid),
    // Dominant colour — sits at the centroid, so bass-heavy → cool, airy → hot.
    body: neon(centroid, color.mid),
    spark: neon(clamp(0, 1, centroid + 0.26), color.highMid),
    // Warm end.
    air: neon(0.96, color.air),
    // The bright "hot" line rides the dominant pitch.
    line: neon(centroid, color.contrast, clamp(0, 1, contrastFlux + 0.15)),
    stops: spectralStops({ signature: color, energy, drift: hueDrift, accentHue, accentPull }),
  };
}

export function hsla(color: HslColor, alpha: number): string {
  return `hsla(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%, ${clamp(0, 1, alpha).toFixed(3)})`;
}
