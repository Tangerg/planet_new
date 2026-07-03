import { clamp } from "@shared/math";

export type SpectrumFrame = {
  bands: readonly number[];
  low: number;
  mid: number;
  high: number;
  peak: number;
  active: boolean;
};

function assertBandCount(bandCount: number): void {
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
    const normalized = bandAverage(bytes, start, end) / 255;
    return clamp(0, 1, Math.pow(normalized, 0.72));
  });

  const lowEnd = Math.max(1, Math.floor(bandCount * 0.32));
  const midEnd = Math.max(lowEnd + 1, Math.floor(bandCount * 0.68));
  const low = average(bands.slice(0, lowEnd));
  const mid = average(bands.slice(lowEnd, midEnd));
  const high = average(bands.slice(midEnd));
  const peak = Math.max(...bands);

  return { bands, low, mid, high, peak, active: peak > 0.025 };
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
    const amount = value >= prev ? attack : release;
    return prev + (value - prev) * clamp(0, 1, amount);
  });
}
