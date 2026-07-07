import { Hct, argbFromHex, hexFromArgb } from "@material/material-color-utilities";

import { clamp } from "@shared/math";

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

// ── Cover multi-colour tonal gradient ────────────────────────────────────────
// Toned from the cover's Material-3 theme colours (up to a few) — same source as
// the page backdrop. The ramp walks through those colours from the deep base to the
// bright crest in HCT while TONE rises deep→bright; tone is perceptually uniform, so
// it's a smooth graded scale. To keep it cohesive, every colour's hue is clamped to
// within HUE_SPREAD of the primary (so no jarring value jumps), and chroma to a
// jewel range so muted covers still show colour and neon ones stay tasteful.
const RAMP_STEPS = 12;
const TONE_BASE = 40; // deepest rung (bar floor) — lifted so the base isn't murky
const TONE_RANGE = 44; // deep → bright span
const CHROMA_MIN = 22;
const CHROMA_MAX = 56;
const MIN_ENDPOINTS = 3; // always gradient through ≥3 colours
const MAX_ENDPOINTS = 4;
const HUE_SPREAD = 34; // max hue distance any colour may sit from the primary
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

/** Shortest-arc hue interpolation. */
function blendHue(from: number, to: number, amount: number): number {
  const delta = ((to - from + 540) % 360) - 180;
  return (from + delta * clamp(0, 1, amount) + 360) % 360;
}

type Endpoint = { hue: number; chroma: number };

function endpointHct(hex: string, fallbackHex: string): { hue: number; chroma: number } {
  try {
    const h = Hct.fromInt(argbFromHex(hex));
    return { hue: h.hue, chroma: clamp(CHROMA_MIN, CHROMA_MAX, h.chroma) };
  } catch {
    const h = Hct.fromInt(argbFromHex(fallbackHex));
    return { hue: h.hue, chroma: clamp(CHROMA_MIN, CHROMA_MAX, h.chroma) };
  }
}

/** Clamp `hue` to within `max` degrees of `base` (shortest arc) — keeps every ramp
 *  colour in the primary's family so values never jump too far apart. */
function clampHueNear(base: number, hue: number, max: number): number {
  const delta = ((hue - base + 540) % 360) - 180;
  return (base + clamp(-max, max, delta) + 360) % 360;
}

/** The cohesive ramp endpoints from the cover colours (deep base → bright crest):
 *  the primary is Score's top colour, the rest follow IN RANK ORDER with hues
 *  clamped near it; padded to ≥MIN_ENDPOINTS with gentle analogous variations. The
 *  accent is a last resort, only when every cover colour is near-greyscale. (Rank
 *  order is kept — re-sorting by saturation would let a small vivid detail hijack
 *  the primary from the artwork's dominant colour.) */
function coverEndpoints(tones: readonly string[], accent: string): Endpoint[] {
  const vivid = tones.filter((hex) => parseHexColor(hex, { h: 300, s: 0, l: 50 }).s >= 12);
  const pool = vivid.length ? vivid : [accent];

  const primary = endpointHct(pool[0], accent);
  const list: Endpoint[] = [primary];
  for (let i = 1; i < pool.length && list.length < MAX_ENDPOINTS; i++) {
    const e = endpointHct(pool[i], accent);
    list.push({ hue: clampHueNear(primary.hue, e.hue, HUE_SPREAD), chroma: e.chroma });
  }
  // Pad to a minimum with gentle analogous variations so the gradient always has
  // several close colours to walk through.
  for (let k = 1; list.length < MIN_ENDPOINTS; k++) {
    const dir = list.length % 2 === 0 ? 1 : -1;
    list.push({ hue: (primary.hue + dir * 12 * k + 360) % 360, chroma: primary.chroma });
  }
  return list;
}

/** Interpolate hue + chroma across the endpoint list at position `at∈[0,1]`. */
function rampAt(endpoints: readonly Endpoint[], at: number): { hue: number; chroma: number } {
  const segments = endpoints.length - 1;
  const p = clamp(0, 1, at) * segments;
  const k = Math.min(segments - 1, Math.floor(p));
  const f = p - k;
  const a = endpoints[k];
  const b = endpoints[k + 1];
  return { hue: blendHue(a.hue, b.hue, f), chroma: a.chroma + (b.chroma - a.chroma) * f };
}

// Colour is fully cover-derived (no per-frame input), so memoize the whole ramp per
// cover palette — no HCT is solved on the render path after the first frame.
const colorsCache = new Map<string, SpectralLightColors>();

export function spectralLightColors({
  accent,
  tones,
}: {
  accent: string;
  tones: readonly string[];
}): SpectralLightColors {
  const key = `${tones.join("|")}|${accent}`;
  const cached = colorsCache.get(key);
  if (cached) return cached;

  const endpoints = coverEndpoints(tones, accent);
  const step = (at: number): HslColor => {
    const { hue, chroma } = rampAt(endpoints, at);
    const tone = TONE_BASE + clamp(0, 1, at) * TONE_RANGE;
    return parseHexColor(hexFromArgb(Hct.from(hue, chroma, tone).toInt()), TONE_FALLBACK);
  };

  const stops = Array.from({ length: RAMP_STEPS }, (_, index): SpectralColorStop => {
    const at = index / (RAMP_STEPS - 1);
    return { at, color: step(at), intensity: 1 };
  });

  const result: SpectralLightColors = {
    bass: step(0),
    warmth: step(0.28),
    body: step(0.5),
    spark: step(0.72),
    air: step(1),
    line: step(0.6),
    stops,
  };
  colorsCache.set(key, result);
  return result;
}

export function hsla(color: HslColor, alpha: number): string {
  return `hsla(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%, ${clamp(0, 1, alpha).toFixed(3)})`;
}
