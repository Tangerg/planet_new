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

// ── Cover two-colour tonal gradient ──────────────────────────────────────────
// Toned from the cover's TWO Material-3 theme colours (primary + secondary) — the
// same two-colour idea the page backdrop uses. The ramp interpolates hue + chroma
// from primary (deep base) to secondary (bright crest) in HCT while TONE rises
// deep→bright; tone is perceptually uniform, so it's a smooth graded scale, not a
// staircase. Chroma is clamped to a jewel range so muted covers still show colour
// and neon ones stay tasteful.
const RAMP_STEPS = 12;
const TONE_BASE = 28; // deepest rung (bar floor)
const TONE_RANGE = 52; // deep → bright span
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

/** Shortest-arc hue interpolation. */
function blendHue(from: number, to: number, amount: number): number {
  const delta = ((to - from + 540) % 360) - 180;
  return (from + delta * clamp(0, 1, amount) + 360) % 360;
}

type Endpoint = { hue: number; chroma: number };

function endpoint(hex: string, fallbackHex: string): Endpoint {
  try {
    const h = Hct.fromInt(argbFromHex(hex));
    return { hue: h.hue, chroma: clamp(CHROMA_MIN, CHROMA_MAX, h.chroma) };
  } catch {
    const h = Hct.fromInt(argbFromHex(fallbackHex));
    return { hue: h.hue, chroma: clamp(CHROMA_MIN, CHROMA_MAX, h.chroma) };
  }
}

/** The two ramp endpoints from the cover pair: the more saturated cover colour is
 *  the primary (deep base), the other the secondary (bright crest). The accent is a
 *  last resort, used only when the cover is near-greyscale, so a vivid brand accent
 *  never hijacks the tone from the artwork. */
function coverEndpoints(
  tintA: string,
  tintB: string,
  accent: string,
): { primary: Endpoint; secondary: Endpoint } {
  const a = parseHexColor(tintA, { h: 300, s: 60, l: 45 });
  const b = parseHexColor(tintB, { h: 300, s: 60, l: 55 });
  const vivid = a.s >= b.s ? { hex: tintA, s: a.s } : { hex: tintB, s: b.s };
  const other = a.s >= b.s ? { hex: tintB, s: b.s } : { hex: tintA, s: a.s };
  const primaryHex = vivid.s >= 12 ? vivid.hex : accent;
  const secondaryHex = other.s >= 12 ? other.hex : primaryHex;
  return {
    primary: endpoint(primaryHex, accent),
    secondary: endpoint(secondaryHex, primaryHex),
  };
}

// Colour is fully cover-derived (no per-frame input), so memoize the whole ramp per
// cover pair — no HCT is solved on the render path after the first frame.
const colorsCache = new Map<string, SpectralLightColors>();

export function spectralLightColors({
  accent,
  tintA,
  tintB,
}: {
  accent: string;
  tintA: string;
  tintB: string;
}): SpectralLightColors {
  const key = `${tintA}|${tintB}|${accent}`;
  const cached = colorsCache.get(key);
  if (cached) return cached;

  const { primary, secondary } = coverEndpoints(tintA, tintB, accent);
  const step = (at: number): HslColor => {
    const t = clamp(0, 1, at);
    const hue = blendHue(primary.hue, secondary.hue, t);
    const chroma = primary.chroma + (secondary.chroma - primary.chroma) * t;
    const tone = TONE_BASE + t * TONE_RANGE;
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
