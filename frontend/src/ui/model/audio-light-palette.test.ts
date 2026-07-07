import { describe, expect, it } from "vitest";

import { hsla, spectralLightColors } from "./audio-light-palette";

const accent = "#18f58a";
const profile = { low: 0.7, mid: 0.44, high: 0.58, peak: 0.84, active: true };

describe("audio light palette model (M3 tonal ramp)", () => {
  it("steps a single-hue tonal ramp from the cover, deep to bright", () => {
    const colors = spectralLightColors({ accent, tintA: "#4a2b7a", tintB: "#a86bff", profile });

    expect(colors.stops).toHaveLength(9);
    // Tone rises across the ramp → deeper base, brighter crest.
    expect(colors.stops[0].color.l).toBeLessThan(colors.stops[colors.stops.length - 1].color.l);
    // A TonalPalette holds one hue → the ramp is a single cohesive family.
    const hues = colors.stops.map((stop) => stop.color.h);
    expect(Math.max(...hues) - Math.min(...hues)).toBeLessThan(40);
  });

  it("re-tones per cover, and uses the accent only for a greyscale cover", () => {
    const violet = spectralLightColors({ accent, tintA: "#4a2b7a", tintB: "#a86bff", profile });
    const amber = spectralLightColors({ accent, tintA: "#5a3208", tintB: "#ffb347", profile });
    const grey = spectralLightColors({ accent, tintA: "#2a2a2c", tintB: "#3a3a3d", profile });

    // Different cover colour → different tonal family.
    expect(Math.abs(violet.body.h - amber.body.h)).toBeGreaterThan(60);
    // A near-greyscale cover falls back to the accent, distinct from the violet cover.
    expect(Math.abs(grey.body.h - violet.body.h)).toBeGreaterThan(40);
  });

  it("formats hsl colors with clamped alpha", () => {
    expect(hsla({ h: 145.4, s: 99.6, l: 54.2 }, 1.8)).toBe("hsla(145, 100%, 54%, 1.000)");
  });
});
