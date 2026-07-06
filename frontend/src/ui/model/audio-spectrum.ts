import { clamp } from "@shared/math";

export const FFT_BYTE_MAX = 255;

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

export function ratioBandAverage(
  bytes: ArrayLike<number>,
  startRatio: number,
  endRatio: number,
): number {
  if (bytes.length === 0) return 0;
  const start = Math.floor(clamp(0, 1, startRatio) * bytes.length);
  const end = Math.min(
    bytes.length,
    Math.max(start + 1, Math.ceil(clamp(0, 1, endRatio) * bytes.length)),
  );
  return bandAverage(bytes, start, end);
}

/**
 * Compress raw FFT bins into display bands. The logarithmic-ish mapping spends
 * more visual resolution on lows/mids where music usually feels most readable.
 */
export function spectrumFrame(bytes: ArrayLike<number>, bandCount: number): SpectrumFrame {
  assertBandCount(bandCount);
  if (bytes.length === 0) {
    const bands = Array.from({ length: bandCount }, () => 0);
    return { bands, low: 0, mid: 0, high: 0, peak: 0, active: false };
  }

  const bands = Array.from({ length: bandCount }, (_, index) => {
    const start = Math.floor(Math.pow(index / bandCount, 1.35) * bytes.length);
    const rawEnd = Math.floor(Math.pow((index + 1) / bandCount, 1.35) * bytes.length);
    const end = Math.min(bytes.length, Math.max(start + 1, rawEnd));
    const normalized = normalizeFftByte(bandAverage(bytes, start, end));
    return clamp(0, 1, Math.pow(normalized, 0.72));
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
