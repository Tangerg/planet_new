import { describe, expect, it } from "vitest";

import {
  adaptiveGain,
  initialAdaptiveGain,
  normalizeFftByte,
  smoothSignalValue,
  smoothSpectrum,
  spectrumFrame,
  spectrumProfile,
} from "./audio-spectrum";

describe("audio spectrum model", () => {
  it("compresses FFT bytes into log-frequency bands weighted toward where energy sits", () => {
    // Energy packed into the low bins → the low group should tower over the highs.
    const bytes = new Uint8Array(64);
    bytes.fill(255, 0, 8);
    const frame = spectrumFrame(bytes, 6);

    expect(frame.bands).toHaveLength(6);
    expect(frame.peak).toBeGreaterThan(0.9);
    expect(frame.low).toBeGreaterThan(frame.high);
    expect(frame.active).toBe(true);
  });

  it("gives the low end finer resolution than the high end (log split)", () => {
    // A flat spectrum: low bands cover few bins, high bands average many, so the
    // averaged high bands read no hotter than the single-bin low bands.
    const bytes = new Uint8Array(256).fill(200);
    const frame = spectrumFrame(bytes, 8);
    expect(frame.bands[0]).toBeGreaterThanOrEqual(frame.bands[frame.bands.length - 1]);
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

describe("adaptive gain", () => {
  const env0 = initialAdaptiveGain(3);

  it("lifts quiet and loud spectra to the same visual range", () => {
    const quiet = adaptiveGain([0.08, 0.05, 0.03], env0);
    const loud = adaptiveGain([0.9, 0.6, 0.35], env0);
    // The loudest band of each fills the range regardless of absolute level.
    expect(Math.max(...quiet.bands)).toBeCloseTo(Math.max(...loud.bands), 5);
    expect(Math.max(...quiet.bands)).toBeGreaterThan(0.9);
  });

  it("keeps a near-dead band from being amplified into noise", () => {
    const { bands } = adaptiveGain([1.0, 0.01], env0.slice(0, 2));
    expect(bands[0]).toBeGreaterThan(0.9);
    expect(bands[1]).toBeLessThan(0.3);
  });

  it("releases the envelope over silent frames and outputs no bands", () => {
    const { bands, env } = adaptiveGain([0, 0], [1, 1]);
    expect(env[0]).toBeLessThan(1);
    expect(env[0]).toBeGreaterThan(0);
    expect(Math.max(...bands)).toBe(0);
  });
});
