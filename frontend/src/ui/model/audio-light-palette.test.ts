import { describe, expect, it } from "vitest";

import { hsla, spectralLightColors } from "./audio-light-palette";

const accent = "#18f58a";

describe("audio light palette model (cover multi-colour tonal gradient)", () => {
  it("gradients deep to bright across the cover's colours", () => {
    const colors = spectralLightColors({ accent, tones: ["#b0402a", "#f2c14e", "#d95f3c"] });

    expect(colors.stops.length).toBeGreaterThan(6);
    // Tone rises across the ramp → deeper base, brighter crest.
    expect(colors.stops[0].color.l).toBeLessThan(colors.stops[colors.stops.length - 1].color.l);
  });

  it("keeps every colour within the primary's family (no far jumps)", () => {
    // A jarring off-hue extra (cyan) alongside a warm cover must be pulled in.
    const colors = spectralLightColors({ accent, tones: ["#e0662f", "#f2c14e", "#22d3d3"] });
    const hues = colors.stops.map((stop) => stop.color.h);
    // All ramp hues stay within a cohesive band (primary ± spread + tone drift).
    expect(Math.max(...hues) - Math.min(...hues)).toBeLessThan(80);
  });

  it("re-tones per cover, and uses the accent only for a greyscale cover", () => {
    const warm = spectralLightColors({ accent, tones: ["#b0402a", "#f2c14e"] });
    const violet = spectralLightColors({ accent, tones: ["#4a2b7a", "#a86bff"] });
    const grey = spectralLightColors({ accent, tones: ["#2a2a2c", "#3a3a3d"] });

    expect(Math.abs(warm.body.h - violet.body.h)).toBeGreaterThan(60);
    expect(Math.abs(grey.body.h - violet.body.h)).toBeGreaterThan(40);
  });

  it("formats hsl colors with clamped alpha", () => {
    expect(hsla({ h: 145.4, s: 99.6, l: 54.2 }, 1.8)).toBe("hsla(145, 100%, 54%, 1.000)");
  });
});
