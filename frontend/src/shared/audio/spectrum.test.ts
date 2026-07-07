import { describe, expect, it } from "vitest";

import {
  adaptiveGain,
  beatEnvelope,
  initialAdaptiveGain,
  normalizeFftByte,
  smoothSignalValue,
  smoothSpectrum,
  spectrumFrame,
} from "./spectrum";

describe("audio spectrum", () => {
  it("compresses FFT bytes into log-frequency bands weighted toward where energy sits", () => {
    // Energy packed into the low bins → the low band should tower over the highs.
    const bytes = new Uint8Array(64);
    bytes.fill(255, 0, 8);
    const frame = spectrumFrame(bytes, 6);

    expect(frame.bands).toHaveLength(6);
    expect(Math.max(...frame.bands)).toBeGreaterThan(0.9);
    expect(frame.bands[0]).toBeGreaterThan(frame.bands[frame.bands.length - 1]);
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
    expect(spectrumFrame(new Uint8Array(), 3)).toEqual({ bands: [0, 0, 0], active: false });
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

  it("follows beats with a fast attack and slow release", () => {
    expect(beatEnvelope(0, 1, 0.5, 0.06)).toBeCloseTo(0.5); // snaps up
    expect(beatEnvelope(1, 0, 0.5, 0.06)).toBeCloseTo(0.94); // eases down
  });

  it("rejects invalid band counts", () => {
    expect(() => spectrumFrame(new Uint8Array([1]), 0)).toThrow("bandCount");
  });
});

describe("adaptive gain", () => {
  // Drive a constant spectrum until the running level settles.
  const converge = (raw: number[], frames = 300) => {
    let level = initialAdaptiveGain(raw.length);
    let out = adaptiveGain(raw, level);
    for (let i = 0; i < frames; i++) {
      out = adaptiveGain(raw, level);
      level = out.level;
    }
    return out;
  };

  it("centres quiet and loud steady spectra at the same level", () => {
    const quiet = converge([0.08, 0.05, 0.03]);
    const loud = converge([0.9, 0.6, 0.35]);
    // A band at its own running level renders at LEVEL_TARGET, whatever the absolute
    // loudness — so both tracks centre at the same height.
    expect(quiet.bands[0]).toBeCloseTo(0.5, 1);
    expect(loud.bands[0]).toBeCloseTo(0.5, 1);
  });

  it("renders instantaneous swings above/below the running level as jitter", () => {
    const steady = converge([0.5, 0.5]);
    const spike = adaptiveGain([0.85, 0.5], steady.level);
    const dip = adaptiveGain([0.28, 0.5], steady.level);
    expect(spike.bands[0]).toBeGreaterThan(0.6);
    expect(dip.bands[0]).toBeLessThan(0.4);
    expect(spike.bands[1]).toBeCloseTo(0.5, 1);
  });

  it("honors a higher contrast option with a bigger swing", () => {
    const steady = converge([0.5, 0.5]);
    const soft = adaptiveGain([0.85, 0.5], steady.level, { contrast: 1.2 });
    const hard = adaptiveGain([0.85, 0.5], steady.level, { contrast: 2.4 });
    expect(hard.bands[0]).toBeGreaterThan(soft.bands[0]);
  });

  it("keeps a near-dead band from being amplified into noise", () => {
    const { bands } = converge([1.0, 0.01]);
    expect(bands[1]).toBeLessThan(0.1);
    expect(bands[0]).toBeGreaterThan(bands[1]);
  });

  it("lets the running level fall over silent frames and outputs no bands", () => {
    const { bands, level } = adaptiveGain([0, 0], [1, 1]);
    expect(level[0]).toBeLessThan(1);
    expect(level[0]).toBeGreaterThan(0);
    expect(Math.max(...bands)).toBe(0);
  });
});
