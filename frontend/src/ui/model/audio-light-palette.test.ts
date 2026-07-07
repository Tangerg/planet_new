import { describe, expect, it } from "vitest";

import { spectrumColorSignature } from "./audio-color-signature";
import { hsla, spectralLightColors } from "./audio-light-palette";

const activeProfile = { low: 0.7, mid: 0.44, high: 0.58, peak: 0.84, active: true };
const signature = spectrumColorSignature(
  new Uint8Array([120, 130, 140, 150, 160, 150, 140, 130, 120, 110, 100, 90]),
);

describe("audio light palette model (cover-toned ramp)", () => {
  it("tones a tight monochromatic ramp from the cover colour", () => {
    // Violet cover pair → the ramp should stay in the violet family.
    const colors = spectralLightColors({
      accent: "#18f58a",
      tintA: "#4a2b7a",
      tintB: "#a86bff",
      profile: activeProfile,
      signature,
    });

    const hues = colors.stops.map((stop) => stop.color.h);
    const span = Math.max(...hues) - Math.min(...hues);
    // One cohesive family, not a rainbow.
    expect(span).toBeLessThan(45);
    // Keyed off the cover's violet hue (~265°), not a fixed palette.
    expect(hues.every((h) => h > 235 && h < 300)).toBe(true);
  });

  it("steps deep at the base to bright at the crest", () => {
    const colors = spectralLightColors({
      accent: "#18f58a",
      tintA: "#4a2b7a",
      tintB: "#a86bff",
      profile: activeProfile,
      signature,
    });
    const stops = colors.stops;
    expect(stops).toHaveLength(9);
    expect(stops[0].color.l).toBeLessThan(stops[stops.length - 1].color.l);
  });

  it("re-tones when the cover colour changes", () => {
    const violet = spectralLightColors({
      accent: "#18f58a",
      tintA: "#4a2b7a",
      tintB: "#a86bff",
      profile: activeProfile,
      signature,
    });
    const amber = spectralLightColors({
      accent: "#18f58a",
      tintA: "#5a3208",
      tintB: "#ffb347",
      profile: activeProfile,
      signature,
    });
    // Different cover → different hue family.
    expect(Math.abs(violet.body.h - amber.body.h)).toBeGreaterThan(60);
  });

  it("keeps saturation rich but restrained", () => {
    const colors = spectralLightColors({
      accent: "#18f58a",
      tintA: "#4a2b7a",
      tintB: "#a86bff",
      profile: activeProfile,
      signature,
    });
    const allColors = [
      colors.bass,
      colors.warmth,
      colors.body,
      colors.spark,
      colors.air,
      colors.line,
      ...colors.stops.map((stop) => stop.color),
    ];
    expect(allColors.every((color) => color.s >= 42 && color.s <= 84)).toBe(true);
  });

  it("formats hsl colors with clamped alpha", () => {
    expect(hsla({ h: 145.4, s: 99.6, l: 54.2 }, 1.8)).toBe("hsla(145, 100%, 54%, 1.000)");
  });
});
