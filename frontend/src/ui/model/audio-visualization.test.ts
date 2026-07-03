import { describe, expect, it } from "vitest";

import { smoothSpectrum, spectrumFrame } from "./audio-visualization";

describe("audio visualization model", () => {
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
    expect(smoothSpectrum([0], [1], 0.4, 0.1)[0]).toBeCloseTo(0.4);
    expect(smoothSpectrum([1], [0], 0.4, 0.1)[0]).toBeCloseTo(0.9);
  });

  it("rejects invalid band counts", () => {
    expect(() => spectrumFrame(new Uint8Array([1]), 0)).toThrow("bandCount");
  });
});
