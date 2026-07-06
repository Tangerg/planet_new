import { clamp } from "@shared/math";

import {
  FFT_BYTE_MAX,
  assertBandCount,
  ratioBandAverage,
  smoothSignalValue,
} from "./audio-spectrum";

export type SpectralColorSignature = {
  bass: number;
  lowMid: number;
  mid: number;
  highMid: number;
  air: number;
  lanes: readonly number[];
  centroid: number;
  contrast: number;
};

const DEFAULT_COLOR_LANES = 9;

function byteBandAverage(bytes: ArrayLike<number>, startRatio: number, endRatio: number): number {
  return clamp(0, FFT_BYTE_MAX, ratioBandAverage(bytes, startRatio, endRatio));
}

function signatureFromLanes(lanes: readonly number[]): SpectralColorSignature {
  if (lanes.length === 0) {
    return {
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      air: 0,
      lanes: [],
      centroid: 0,
      contrast: 0,
    };
  }

  let total = 0;
  let weighted = 0;
  let peak = 0;
  for (let i = 0; i < lanes.length; i++) {
    const value = clamp(0, FFT_BYTE_MAX, lanes[i] ?? 0);
    total += value;
    weighted += (lanes.length === 1 ? 0 : i / (lanes.length - 1)) * value;
    peak = Math.max(peak, value);
  }
  const mean = total / lanes.length;

  return {
    bass: lanes[0] ?? 0,
    lowMid: byteBandAverage(lanes, 0.12, 0.3),
    mid: byteBandAverage(lanes, 0.3, 0.58),
    highMid: byteBandAverage(lanes, 0.58, 0.8),
    air: lanes[lanes.length - 1] ?? 0,
    lanes,
    centroid: total > 0 ? clamp(0, FFT_BYTE_MAX, (weighted / total) * FFT_BYTE_MAX) : 0,
    contrast: clamp(0, FFT_BYTE_MAX, peak - mean),
  };
}

export function spectrumColorSignature(
  bytes: ArrayLike<number>,
  laneCount = DEFAULT_COLOR_LANES,
): SpectralColorSignature {
  assertBandCount(laneCount);
  if (bytes.length === 0) {
    return signatureFromLanes(Array.from({ length: laneCount }, () => 0));
  }

  const lanes = Array.from({ length: laneCount }, (_, index) => {
    const start = index / laneCount;
    const end = (index + 1) / laneCount;
    const linear = byteBandAverage(bytes, start, end);
    const octaveStart = Math.pow(start, 1.32);
    const octaveEnd = Math.pow(end, 1.32);
    const musical = byteBandAverage(bytes, octaveStart, octaveEnd);
    return clamp(0, FFT_BYTE_MAX, linear * 0.38 + musical * 0.62);
  });

  return signatureFromLanes(lanes);
}

export function smoothColorSignature(
  previous: SpectralColorSignature | undefined,
  next: SpectralColorSignature,
  attack = 0.22,
  release = 0.07,
): SpectralColorSignature {
  if (!previous) return next;
  const length = Math.max(previous.lanes.length, next.lanes.length);
  const lanes = Array.from({ length }, (_, index) =>
    smoothSignalValue(previous.lanes[index] ?? 0, next.lanes[index] ?? 0, attack, release),
  );
  return signatureFromLanes(lanes);
}
