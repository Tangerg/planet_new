import { describe, expect, it } from "vitest";

import { smoothColorSignature, spectrumColorSignature } from "./audio-color-signature";

describe("audio color signature model", () => {
  it("derives color channels directly from FFT byte ranges", () => {
    const signature = spectrumColorSignature(new Uint8Array([255, 220, 64, 32, 12, 8, 4, 2]));

    expect(signature.lanes).toHaveLength(9);
    expect(signature.bass).toBeGreaterThan(signature.mid);
    expect(signature.mid).toBeGreaterThan(signature.air);
    expect(signature.centroid).toBeLessThan(96);
    expect(signature.contrast).toBeGreaterThan(128);
  });

  it("smooths spectral color signatures without flattening the target shape", () => {
    const quiet = spectrumColorSignature(new Uint8Array([8, 10, 12, 14, 16]), 5);
    const loud = spectrumColorSignature(new Uint8Array([240, 220, 180, 120, 80]), 5);
    const smoothed = smoothColorSignature(quiet, loud, 0.5, 0.08);

    expect(smoothed.lanes).toHaveLength(5);
    expect(smoothed.lanes[0]).toBeGreaterThan(quiet.lanes[0]);
    expect(smoothed.lanes[0]).toBeLessThan(loud.lanes[0]);
    expect(smoothed.bass).toBeGreaterThan(smoothed.air);
  });
});
