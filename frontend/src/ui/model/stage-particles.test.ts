import { describe, expect, it } from "vitest";

import { sampleCoverParticles } from "./stage-particles";

// A 2×2 RGBA image: red, green / blue, transparent.
const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 0, 0, 0, 0]);

describe("stage particle sampling", () => {
  it("samples opaque cells into a normalized particle cloud, dropping transparent ones", () => {
    const p = sampleCoverParticles(rgba, 2, 2, 2);

    // The fully-transparent cell is dropped; the three opaque ones remain.
    expect(p.count).toBe(3);
    // Positions are centred on the cover and stay within [-0.5, 0.5].
    for (let i = 0; i < p.count; i++) {
      expect(p.nx[i]).toBeGreaterThanOrEqual(-0.5);
      expect(p.nx[i]).toBeLessThanOrEqual(0.5);
      expect(p.ny[i]).toBeGreaterThanOrEqual(-0.5);
      expect(p.ny[i]).toBeLessThanOrEqual(0.5);
    }
    // First cell keeps its pixel colour (pure red) and its luma.
    expect(p.r[0]).toBeCloseTo(1);
    expect(p.g[0]).toBeCloseTo(0);
    expect(p.luma[0]).toBeCloseTo(0.299);
  });

  it("aspect-corrects a wide cover so the long axis fills the range", () => {
    const wide = sampleCoverParticles(rgba, 4, 1, 2);
    let maxX = 0;
    let maxY = 0;
    for (let i = 0; i < wide.count; i++) {
      maxX = Math.max(maxX, Math.abs(wide.nx[i]));
      maxY = Math.max(maxY, Math.abs(wide.ny[i]));
    }
    expect(maxX).toBeGreaterThan(maxY); // wider than tall
  });
});
