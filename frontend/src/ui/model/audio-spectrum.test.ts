import { describe, expect, it } from "vitest";

import {
  normalizeFftByte,
  smoothSignalValue,
  smoothSpectrum,
  spectrumFrame,
  spectrumProfile,
} from "./audio-spectrum";

describe("audio spectrum model", () => {
  it("compresses FFT bytes into semantic bands and energy groups", () => {
    const frame = spectrumFrame(new Uint8Array([0, 64, 128, 255, 255, 64, 32, 0]), 4);

    expect(frame.bands).toHaveLength(4);
    expect(frame.peak).toBeGreaterThan(0.9);
    expect(frame.mid).toBeGreaterThan(frame.low);
    expect(frame.active).toBe(true);
  });

  it("returns an inactive zero frame for empty input", () => {
    expect(spectrumFrame(new Uint8Array(), 3)).toEqual({
      bands: [0, 0, 0],
      low: 0,
      mid: 0,
      high: 0,
      peak: 0,
      active: false,
    });
  });

  it("smooths attacks faster than releases", () => {
    expect(smoothSignalValue(0, 1, 0.4, 0.1)).toBeCloseTo(0.4);
    expect(smoothSignalValue(1, 0, 0.4, 0.1)).toBeCloseTo(0.9);
    expect(smoothSpectrum([0], [1], 0.4, 0.1)[0]).toBeCloseTo(0.4);
    expect(smoothSpectrum([1], [0], 0.4, 0.1)[0]).toBeCloseTo(0.9);
  });

  it("normalizes FFT bytes into unit signal strength", () => {
    expect(normalizeFftByte(0)).toBe(0);
    expect(normalizeFftByte(255)).toBe(1);
    expect(normalizeFftByte(510)).toBe(1);
  });

  it("derives a profile from already smoothed display bands", () => {
    const profile = spectrumProfile([0.8, 0.6, 0.1, 0.1, 0.05, 0.02]);

    expect(profile.low).toBeGreaterThan(profile.high);
    expect(profile.peak).toBeCloseTo(0.8);
    expect(profile.active).toBe(true);
  });

  it("rejects invalid band counts", () => {
    expect(() => spectrumFrame(new Uint8Array([1]), 0)).toThrow("bandCount");
  });
});
