import { clamp } from "@shared/math";

// Pure spectral DSP: FFT bytes → log-frequency display bands, per-band adaptive
// gain, smoothing, and a beat envelope. Framework-agnostic and zero-dependency
// (only @shared/math), so it lives in @shared — the live AnalyserNode (Web Audio
// I/O) stays in @core; these are just the algorithms operating on number arrays.

export const FFT_BYTE_MAX = 255;

// The lowest FFT bin is DC (0 Hz) — an offset, not music. Start the bass band at
// the first real bin so a bin's worth of DC leakage never dominates the low end.
const START_BIN = 1;

// Only the lower fraction of FFT bins carries musical energy; the very top
// (~16 kHz+) is near-silent in most tracks. With per-band gain downstream, mapping
// bands into that dead zone would just amplify noise, so cap the band range below it.
const USABLE_BIN_RATIO = 0.72;

// --- Per-band auto-level (AGC) ---------------------------------------------
// Absolute loudness varies wildly between tracks (mastering level) and between
// bands (music is bass-heavy, pink-ish), so a fixed mapping makes some songs
// thrash and others barely move. Normalise each band against its own slow-moving
// RUNNING LEVEL — a stable reference the instantaneous band swings around. Loud
// and quiet tracks both centre at the same height, yet each keeps its beat-to-beat
// jitter (how far the moment sits above/below its running level). This is the
// crucial difference from an instant-attack peak follower, which keeps raw ≈ its
// own envelope and so pins loud steady tracks to the ceiling with no motion. A
// relative floor keeps dead bands and the silence between tracks from being
// amplified into noise.
const LEVEL_RISE = 0.12; // running level tracks louder frames this fast…
const LEVEL_FALL = 0.035; // …and quieter frames slower, keeping the reference steady
const LEVEL_TARGET = 0.5; // where a band sitting exactly at its running level renders
const LEVEL_CONTRAST = 1.6; // >1 exaggerates deviations from the level into visible jitter
const GAIN_FLOOR_ABS = 0.02; // never divide by less than this (silence guard)
const GAIN_FLOOR_REL = 0.12; // a band below this fraction of the loudest isn't boosted

// A frame whose loudest band stays below this reads as silence (paused / between
// tracks) — the visualizer settles instead of amplifying noise.
const ACTIVE_PEAK = 0.025;

export type SpectrumFrame = {
  bands: readonly number[];
  active: boolean;
};

export function assertBandCount(bandCount: number): void {
  if (!Number.isInteger(bandCount) || bandCount <= 0) {
    throw new Error("bandCount must be a positive integer");
  }
}

function bandAverage(bytes: ArrayLike<number>, start: number, end: number): number {
  let sum = 0;
  let count = 0;
  for (let i = start; i < end; i++) {
    sum += bytes[i] ?? 0;
    count++;
  }
  return count > 0 ? sum / count : 0;
}

export function normalizeFftByte(value: number): number {
  return clamp(0, 1, value / FFT_BYTE_MAX);
}

export function smoothSignalValue(
  previous: number,
  next: number,
  attack: number,
  release: number,
): number {
  const amount = next >= previous ? attack : release;
  return previous + (next - previous) * clamp(0, 1, amount);
}

/**
 * Geometric (log-frequency) bin edge for band `k` of `count`, spanning
 * [START_BIN, top]. Human pitch is logarithmic, so equal-ratio bands give the
 * low end fine resolution and the high end wide averaging — the standard
 * constant-Q-style split used by spectrum analyzers.
 */
function bandBinEdge(k: number, count: number, top: number): number {
  return START_BIN * Math.pow(top / START_BIN, k / count);
}

/**
 * Compress raw FFT bins into log-frequency display bands (raw magnitude, before
 * adaptive gain). Low bands map to few bins (narrow Hz, real bass resolution),
 * high bands to many bins (wide averaging).
 */
export function spectrumFrame(bytes: ArrayLike<number>, bandCount: number): SpectrumFrame {
  assertBandCount(bandCount);
  if (bytes.length === 0) {
    return { bands: Array.from({ length: bandCount }, () => 0), active: false };
  }

  const top = Math.max(START_BIN + bandCount, Math.floor(bytes.length * USABLE_BIN_RATIO));
  let peak = 0;
  const bands = Array.from({ length: bandCount }, (_, index) => {
    const start = Math.floor(bandBinEdge(index, bandCount, top));
    const rawEnd = Math.floor(bandBinEdge(index + 1, bandCount, top));
    const end = Math.min(bytes.length, Math.max(start + 1, rawEnd));
    const value = normalizeFftByte(bandAverage(bytes, start, end));
    if (value > peak) peak = value;
    return value;
  });

  return { bands, active: peak > ACTIVE_PEAK };
}

/** Per-band running level carried across frames — the AGC divisor's memory. */
export type AdaptiveGainState = readonly number[];

/** Per-call AGC tuning; each field defaults to the module constant above. Lets a
 *  consumer shape the dynamics (a gentle effect vs an agitated one). */
export type AdaptiveGainOptions = {
  rise?: number;
  fall?: number;
  target?: number;
  contrast?: number;
  floorAbs?: number;
  floorRel?: number;
};

export function initialAdaptiveGain(bandCount: number): number[] {
  return Array.from({ length: bandCount }, () => 0);
}

/**
 * Normalise each raw band against its own slow running level (fast rise, slow
 * fall), rendering the moment's deviation from that level with contrast. Quiet and
 * loud tracks both centre at `target`, while each keeps its beat-to-beat motion.
 * Returns the display bands and the updated level to carry forward. Pure.
 */
export function adaptiveGain(
  raw: readonly number[],
  previousLevel: AdaptiveGainState,
  opts: AdaptiveGainOptions = {},
): { bands: number[]; level: number[] } {
  const rise = opts.rise ?? LEVEL_RISE;
  const fall = opts.fall ?? LEVEL_FALL;
  const target = opts.target ?? LEVEL_TARGET;
  const contrast = opts.contrast ?? LEVEL_CONTRAST;
  const floorAbs = opts.floorAbs ?? GAIN_FLOOR_ABS;
  const floorRel = opts.floorRel ?? GAIN_FLOOR_REL;

  const level = raw.map((value, i) => {
    const prev = previousLevel[i] ?? 0;
    const rate = value >= prev ? rise : fall;
    return prev + (value - prev) * rate;
  });
  const peakLevel = level.reduce((max, value) => (value > max ? value : max), 0);
  const floor = Math.max(floorAbs, peakLevel * floorRel);
  const bands = raw.map((value, i) => {
    const divisor = Math.max(level[i] ?? 0, floor);
    return clamp(0, 1, target * Math.pow(value / divisor, contrast));
  });
  return { bands, level };
}

/** Attack is intentionally faster than release so peaks feel responsive while
 * fades stay smooth rather than twitchy. */
export function smoothSpectrum(
  previous: readonly number[],
  next: readonly number[],
  attack = 0.34,
  release = 0.12,
): number[] {
  return next.map((value, index) => {
    const prev = previous[index] ?? 0;
    return smoothSignalValue(prev, value, attack, release);
  });
}

/**
 * One-pole envelope follower with independent attack/release — turns a raw energy
 * signal into a smooth "beat" that pops on transients and eases back. Pure; the
 * caller holds the previous value.
 */
export function beatEnvelope(
  previous: number,
  energy: number,
  attack = 0.5,
  release = 0.06,
): number {
  const rate = energy > previous ? attack : release;
  return previous + (energy - previous) * rate;
}
