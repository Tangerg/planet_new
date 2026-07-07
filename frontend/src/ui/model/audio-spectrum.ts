import { clamp } from "@shared/math";

export const FFT_BYTE_MAX = 255;

// The lowest FFT bin is DC (0 Hz) — an offset, not music. Start the bass band at
// the first real bin so a bin's worth of DC leakage never dominates the low end.
const START_BIN = 1;

// Only the lower fraction of FFT bins carries musical energy; the very top
// (~16 kHz+) is near-silent in most tracks. With per-band gain downstream, mapping
// bands into that dead zone would just amplify noise, so cap the band range below it.
const USABLE_BIN_RATIO = 0.72;

// Perceptual contrast curve applied to the gained bands. Bytes are already
// dB-scaled, so this stays gentle — just a touch of lift for readability.
const DISPLAY_GAMMA = 0.9;

// --- Per-band automatic gain (AGC) -----------------------------------------
// Absolute loudness varies wildly between tracks (mastering level) and between
// bands (music is bass-heavy, pink-ish), so a fixed mapping makes some songs
// thrash and others barely move. Normalise each band by its own slow-release peak
// envelope: every band, and every track loud or quiet, fills the visual range —
// the standard fix for "some songs don't react". A relative floor keeps genuinely
// dead bands (and silence between tracks) from being amplified into noise.
const GAIN_RELEASE = 0.975; // per-frame envelope decay; attack is instant
const GAIN_FLOOR_ABS = 0.02; // never divide by less than this (silence guard)
const GAIN_FLOOR_REL = 0.1; // a band below 10% of the loudest is not boosted

export type SpectrumFrame = {
  bands: readonly number[];
  low: number;
  mid: number;
  high: number;
  peak: number;
  active: boolean;
};

export type SpectrumProfile = Omit<SpectrumFrame, "bands">;

export function assertBandCount(bandCount: number): void {
  if (!Number.isInteger(bandCount) || bandCount <= 0) {
    throw new Error("bandCount must be a positive integer");
  }
}

function average(values: readonly number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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
    const bands = Array.from({ length: bandCount }, () => 0);
    return { bands, low: 0, mid: 0, high: 0, peak: 0, active: false };
  }

  const top = Math.max(START_BIN + bandCount, Math.floor(bytes.length * USABLE_BIN_RATIO));
  const bands = Array.from({ length: bandCount }, (_, index) => {
    const start = Math.floor(bandBinEdge(index, bandCount, top));
    const rawEnd = Math.floor(bandBinEdge(index + 1, bandCount, top));
    const end = Math.min(bytes.length, Math.max(start + 1, rawEnd));
    return normalizeFftByte(bandAverage(bytes, start, end));
  });

  const profile = spectrumProfile(bands);
  return { bands, ...profile };
}

export function spectrumProfile(bands: readonly number[]): SpectrumProfile {
  if (bands.length === 0) return { low: 0, mid: 0, high: 0, peak: 0, active: false };

  const lowEnd = Math.max(1, Math.floor(bands.length * 0.32));
  const midEnd = Math.max(lowEnd + 1, Math.floor(bands.length * 0.68));
  const low = average(bands.slice(0, lowEnd));
  const mid = average(bands.slice(lowEnd, midEnd));
  const high = average(bands.slice(midEnd));
  const peak = Math.max(...bands);

  return { low, mid, high, peak, active: peak > 0.025 };
}

/** Per-band envelope carried across frames — the AGC divisor's memory. */
export type AdaptiveGainState = readonly number[];

export function initialAdaptiveGain(bandCount: number): number[] {
  return Array.from({ length: bandCount }, () => 0);
}

/**
 * Normalise each raw band by its own peak envelope (instant attack, slow
 * release), so quiet and loud bands/tracks both fill the range. Returns the
 * gained display bands and the updated envelope to carry to the next frame. Pure.
 */
export function adaptiveGain(
  raw: readonly number[],
  previousEnv: AdaptiveGainState,
): { bands: number[]; env: number[] } {
  const env = raw.map((value, i) => Math.max(value, (previousEnv[i] ?? 0) * GAIN_RELEASE));
  const peakEnv = env.reduce((max, value) => (value > max ? value : max), 0);
  const floor = Math.max(GAIN_FLOOR_ABS, peakEnv * GAIN_FLOOR_REL);
  const bands = raw.map((value, i) => {
    const divisor = Math.max(env[i] ?? 0, floor);
    return clamp(0, 1, Math.pow(value / divisor, DISPLAY_GAMMA));
  });
  return { bands, env };
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
