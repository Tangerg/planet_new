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

const LUXURY_PALETTE: readonly HslColor[] = [
  { h: 352, s: 30, l: 49 },
  { h: 16, s: 42, l: 44 },
  { h: 31, s: 45, l: 48 },
  { h: 45, s: 38, l: 55 },
  { h: 78, s: 30, l: 42 },
  { h: 138, s: 36, l: 42 },
  { h: 162, s: 34, l: 46 },
  { h: 188, s: 30, l: 54 },
];

type SpectralHslOptions = {
  primary: number;
  secondary: number;
  offset: number;
  anchor: HslColor;
  energy: number;
  contrast: number;
  satBias: number;
  lightBias: number;
  active: boolean;
};

type LaneColorOptions = {
  value: number;
  previous: number;
  next: number;
  at: number;
  index: number;
  centroid: number;
  contrast: number;
  energy: number;
  anchor: HslColor;
  active: boolean;
};

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

  if (delta === 0) return { h: 145, s: 0, l: lightness * 100 };

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

function tune(
  color: HslColor,
  hueShift: number,
  saturationShift: number,
  lightnessShift: number,
): HslColor {
  return {
    h: (color.h + hueShift + 360) % 360,
    s: clamp(0, 100, color.s + saturationShift),
    l: clamp(0, 100, color.l + lightnessShift),
  };
}

function blendHue(from: number, to: number, amount: number): number {
  const delta = ((to - from + 540) % 360) - 180;
  return (from + delta * clamp(0, 1, amount) + 360) % 360;
}

/**
 * Fold any real into [0,1] via a period-2 triangle wave. Unlike `fract()` (which
 * this replaced), it has NO seam: the value eases back down instead of snapping
 * 0.99→0.01, so the palette hue sweeps smoothly across the wheel AND reverses at
 * the ends rather than jumping crimson↔cyan whenever the spectral sum crosses an
 * integer. That discontinuity was the source of the visualizer's colour "jumps".
 */
function foldUnit(value: number): number {
  const wrapped = ((value % 2) + 2) % 2;
  return 1 - Math.abs(1 - wrapped);
}

function mixChannel(from: number, to: number, amount: number): number {
  return from + (to - from) * clamp(0, 1, amount);
}

function mixHsl(from: HslColor, to: HslColor, amount: number): HslColor {
  return {
    h: blendHue(from.h, to.h, amount),
    s: mixChannel(from.s, to.s, amount),
    l: mixChannel(from.l, to.l, amount),
  };
}

function luxuryPaletteColor(seed: number): HslColor {
  const position = clamp(0, 0.999, seed) * (LUXURY_PALETTE.length - 1);
  const index = Math.floor(position);
  const next = Math.min(LUXURY_PALETTE.length - 1, index + 1);
  return mixHsl(
    LUXURY_PALETTE[index] ?? LUXURY_PALETTE[0],
    LUXURY_PALETTE[next] ?? LUXURY_PALETTE[0],
    position - index,
  );
}

function isCheapBluePurpleHue(hue: number): boolean {
  const normalized = (hue + 360) % 360;
  return normalized >= 210 && normalized <= 320;
}

function restrainAnchor(anchor: HslColor, seed: number): HslColor {
  const fallback = luxuryPaletteColor(seed);
  const h = isCheapBluePurpleHue(anchor.h) ? fallback.h : anchor.h;
  return {
    h,
    s: clamp(22, 54, anchor.s),
    l: clamp(30, 58, anchor.l),
  };
}

function spectralHsl({
  primary,
  secondary,
  offset,
  anchor,
  energy,
  contrast,
  satBias,
  lightBias,
  active,
}: SpectralHslOptions): HslColor {
  const normalized = normalizeFftByte(primary);
  const secondaryNorm = normalizeFftByte(secondary);
  const seed = foldUnit(
    normalized * 0.53 + secondaryNorm * 0.31 + offset * 0.0017 + contrast * 0.11,
  );
  const base = luxuryPaletteColor(seed);
  const anchorAmount = active ? 0.1 : 0.68;
  const color = mixHsl(base, restrainAnchor(anchor, seed), anchorAmount);
  return {
    h: color.h,
    s: clamp(34, 70, color.s + normalized * 10 + contrast * 8 + satBias * 0.28),
    l: clamp(28, 64, color.l + secondaryNorm * 5 + energy * 7 + lightBias * 0.35),
  };
}

function anchorForLane(
  at: number,
  bassAnchor: HslColor,
  bodyAnchor: HslColor,
  airAnchor: HslColor,
): HslColor {
  if (at <= 0.5) return mixHsl(bassAnchor, bodyAnchor, at / 0.5);
  return mixHsl(bodyAnchor, airAnchor, (at - 0.5) / 0.5);
}

function spectralLaneColor({
  value,
  previous,
  next,
  at,
  index,
  centroid,
  contrast,
  energy,
  anchor,
  active,
}: LaneColorOptions): HslColor {
  const normalized = normalizeFftByte(value);
  const localFlux = normalizeFftByte(Math.abs(next - previous));
  const contrastNorm = normalizeFftByte(contrast);
  const centroidNorm = normalizeFftByte(centroid);
  const seed = foldUnit(
    normalized * 0.47 +
      centroidNorm * 0.24 +
      contrastNorm * 0.13 +
      localFlux * 0.11 +
      at * 0.33 +
      index * 0.071,
  );
  const base = luxuryPaletteColor(seed);
  const anchorAmount = active ? 0.06 + (1 - contrastNorm) * 0.1 : 0.66;
  const color = mixHsl(base, restrainAnchor(anchor, seed), anchorAmount);

  return {
    h: color.h,
    s: clamp(34, 70, color.s + normalized * 12 + contrastNorm * 6 + localFlux * 5),
    l: clamp(27, 64, color.l + normalized * 5 + energy * 7 + localFlux * 4),
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
  profile,
  energy,
  bassAnchor,
  bodyAnchor,
  airAnchor,
}: {
  signature: SpectralColorSignature;
  profile: SpectrumProfile;
  energy: number;
  bassAnchor: HslColor;
  bodyAnchor: HslColor;
  airAnchor: HslColor;
}): SpectralColorStop[] {
  const lanes = signature.lanes.length
    ? signature.lanes
    : [signature.bass, signature.lowMid, signature.mid, signature.highMid, signature.air];
  return lanes.map((value, index): SpectralColorStop => {
    const at = lanes.length === 1 ? 0.5 : index / (lanes.length - 1);
    const previous = lanes[Math.max(0, index - 1)] ?? value;
    const next = lanes[Math.min(lanes.length - 1, index + 1)] ?? value;
    const anchor = anchorForLane(at, bassAnchor, bodyAnchor, airAnchor);
    const localFlux = normalizeFftByte(Math.abs(next - previous));
    return {
      at,
      color: spectralLaneColor({
        value,
        previous,
        next,
        at,
        index,
        centroid: signature.centroid,
        contrast: signature.contrast,
        energy,
        anchor,
        active: profile.active,
      }),
      intensity: clamp(0, 1, normalizeFftByte(value) + localFlux * 0.35),
    };
  });
}

export function spectralLightColors({
  accent,
  tintA,
  tintB,
  profile,
  signature,
}: {
  accent: string;
  tintA: string;
  tintB: string;
  profile: SpectrumProfile;
  signature?: SpectralColorSignature;
}): SpectralLightColors {
  const fallbackAccent = { h: 145, s: 100, l: 54 };
  const bassAnchor = parseHexColor(tintA, { h: 155, s: 58, l: 52 });
  const bodyAnchor = parseHexColor(accent, fallbackAccent);
  const airAnchor = parseHexColor(tintB, { h: 190, s: 72, l: 58 });
  const color = signature ?? profileFallbackSignature(profile);

  const low = clamp(0, 1, profile.low);
  const mid = clamp(0, 1, profile.mid);
  const peak = clamp(0, 1, profile.peak);
  const energy = clamp(0, 1, low * 0.52 + mid * 0.3 + peak * 0.18);
  const contrast = normalizeFftByte(color.contrast);

  return {
    bass: spectralHsl({
      primary: color.bass,
      secondary: color.lowMid,
      offset: 12,
      anchor: bassAnchor,
      energy,
      contrast,
      satBias: 4,
      lightBias: -5,
      active: profile.active,
    }),
    warmth: spectralHsl({
      primary: color.lowMid,
      secondary: color.mid,
      offset: 64,
      anchor: tune(bassAnchor, 22, 0, 0),
      energy,
      contrast,
      satBias: 8,
      lightBias: -1,
      active: profile.active,
    }),
    body: spectralHsl({
      primary: color.mid,
      secondary: color.centroid,
      offset: 132,
      anchor: bodyAnchor,
      energy,
      contrast,
      satBias: 12,
      lightBias: 2,
      active: profile.active,
    }),
    spark: spectralHsl({
      primary: color.highMid,
      secondary: color.air,
      offset: 214,
      anchor: tune(bodyAnchor, 34, -8, 4),
      energy,
      contrast,
      satBias: 16,
      lightBias: 9,
      active: profile.active,
    }),
    air: spectralHsl({
      primary: color.air,
      secondary: color.centroid,
      offset: 292,
      anchor: airAnchor,
      energy,
      contrast,
      satBias: 10,
      lightBias: 7,
      active: profile.active,
    }),
    line: spectralHsl({
      primary: color.centroid,
      secondary: color.mid,
      offset: color.contrast * 0.7,
      anchor: bodyAnchor,
      energy,
      contrast,
      satBias: 20,
      lightBias: 10,
      active: profile.active,
    }),
    stops: spectralStops({
      signature: color,
      profile,
      energy,
      bassAnchor,
      bodyAnchor,
      airAnchor,
    }),
  };
}

export function hsla(color: HslColor, alpha: number): string {
  return `hsla(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%, ${clamp(0, 1, alpha).toFixed(3)})`;
}
