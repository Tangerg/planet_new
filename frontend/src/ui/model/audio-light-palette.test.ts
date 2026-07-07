import { describe, expect, it } from "vitest";

import { spectrumColorSignature } from "./audio-color-signature";
import { hsla, spectralLightColors } from "./audio-light-palette";

const base = { accent: "#14ff82", tintA: "#2bd4ff", tintB: "#ff2d95" };
const activeProfile = { low: 0.7, mid: 0.44, high: 0.58, peak: 0.84, active: true };

// Position on the cool→warm ramp: 0 = cool (indigo-blue), 1 = warm (dusty rose).
// Mirrors the model's COOL_HUE=228 + at*120 sweep.
function rampPosition(hue: number): number {
  return Math.min(1, Math.max(0, ((((hue - 228) % 360) + 360) % 360) / 120));
}

describe("audio light palette model (cyberpunk temperature)", () => {
  it("maps low frequencies cool and high frequencies warm across the spectrum", () => {
    const colors = spectralLightColors({
      ...base,
      profile: activeProfile,
      signature: spectrumColorSignature(
        new Uint8Array([120, 130, 140, 150, 160, 150, 140, 130, 120, 110, 100, 90]),
      ),
    });

    const stops = colors.stops;
    expect(stops).toHaveLength(9);
    // Lowest band reads cool, highest band reads warm.
    expect(rampPosition(stops[0].color.h)).toBeLessThan(0.3);
    expect(rampPosition(stops[stops.length - 1].color.h)).toBeGreaterThan(0.7);
    // The ramp is monotonic cool→warm across the bar.
    for (let i = 1; i < stops.length; i++) {
      expect(rampPosition(stops[i].color.h)).toBeGreaterThanOrEqual(
        rampPosition(stops[i - 1].color.h),
      );
    }
    expect(new Set(stops.map((stop) => Math.round(stop.color.h))).size).toBeGreaterThan(5);
  });

  it("burns the dominant colour toward the music's pitch (bass cool, air hot)", () => {
    const bassHeavy = spectralLightColors({
      ...base,
      profile: activeProfile,
      signature: spectrumColorSignature(
        new Uint8Array([245, 220, 184, 42, 28, 18, 12, 8, 6, 4, 2, 2]),
      ),
    });
    const airHeavy = spectralLightColors({
      ...base,
      profile: activeProfile,
      signature: spectrumColorSignature(
        new Uint8Array([8, 12, 16, 32, 48, 90, 142, 190, 228, 252, 244, 232]),
      ),
    });

    // Bass-dominant → cooler dominant colour than a treble-dominant spectrum.
    expect(rampPosition(bassHeavy.body.h)).toBeLessThan(rampPosition(airHeavy.body.h));
    expect(rampPosition(bassHeavy.line.h)).toBeLessThan(rampPosition(airHeavy.line.h));
  });

  it("keeps colours in a restrained jewel range (not fluorescent)", () => {
    const colors = spectralLightColors({
      ...base,
      profile: activeProfile,
      signature: spectrumColorSignature(
        new Uint8Array([12, 46, 82, 156, 212, 252, 238, 184, 124, 74, 32, 16]),
      ),
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

    // Rich but restrained — never max-saturated candy, and deep rather than bright.
    expect(allColors.every((color) => color.s >= 46 && color.s <= 82)).toBe(true);
    expect(allColors.every((color) => color.l <= 58)).toBe(true);
  });

  it("formats hsl colors with clamped alpha", () => {
    expect(hsla({ h: 145.4, s: 99.6, l: 54.2 }, 1.8)).toBe("hsla(145, 100%, 54%, 1.000)");
  });
});
