import { describe, expect, it } from "vitest";

import { hsla, spectralLightColors } from "./audio-light-palette";

const accent = "#18f58a";

describe("audio light palette model (cover two-colour tonal gradient)", () => {
  it("gradients deep to bright across the cover's two colours", () => {
    const colors = spectralLightColors({ accent, tintA: "#b0402a", tintB: "#f2c14e" });

    expect(colors.stops.length).toBeGreaterThan(6);
    // Tone rises across the ramp → deeper base, brighter crest.
    expect(colors.stops[0].color.l).toBeLessThan(colors.stops[colors.stops.length - 1].color.l);
  });

  it("re-tones per cover, and uses the accent only for a greyscale cover", () => {
    const warm = spectralLightColors({ accent, tintA: "#b0402a", tintB: "#f2c14e" });
    const violet = spectralLightColors({ accent, tintA: "#4a2b7a", tintB: "#a86bff" });
    const grey = spectralLightColors({ accent, tintA: "#2a2a2c", tintB: "#3a3a3d" });

    // Different cover colours → different tonal family.
    expect(Math.abs(warm.body.h - violet.body.h)).toBeGreaterThan(60);
    // A near-greyscale cover falls back to the accent, distinct from the violet cover.
    expect(Math.abs(grey.body.h - violet.body.h)).toBeGreaterThan(40);
  });

  it("formats hsl colors with clamped alpha", () => {
    expect(hsla({ h: 145.4, s: 99.6, l: 54.2 }, 1.8)).toBe("hsla(145, 100%, 54%, 1.000)");
  });
});
