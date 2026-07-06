import { describe, expect, it } from "vitest";

import { spectrumColorSignature } from "./audio-color-signature";
import { hsla, spectralLightColors, type HslColor } from "./audio-light-palette";

function cheapBluePurple(color: HslColor): boolean {
  const hue = (color.h + 360) % 360;
  return hue >= 210 && hue <= 320;
}

describe("audio light palette model", () => {
  it("moves light colors with FFT byte data instead of only cover tint", () => {
    const base = { accent: "#14ff82", tintA: "#b58a8a", tintB: "#9aaeb6" };
    const profile = { low: 0.7, mid: 0.44, high: 0.58, peak: 0.84, active: true };
    const bassSignature = spectrumColorSignature(
      new Uint8Array([245, 220, 184, 42, 28, 18, 12, 8, 6, 4, 2, 2]),
    );
    const airSignature = spectrumColorSignature(
      new Uint8Array([8, 12, 16, 32, 48, 90, 142, 190, 228, 252, 244, 232]),
    );
    const bassHeavy = spectralLightColors({
      ...base,
      profile,
      signature: bassSignature,
    });
    const airHeavy = spectralLightColors({
      ...base,
      profile,
      signature: airSignature,
    });

    expect(bassHeavy.body.h).not.toBeCloseTo(airHeavy.body.h);
    expect(bassHeavy.spark.h).not.toBeCloseTo(airHeavy.spark.h);
    expect(bassHeavy.air.h).not.toBeCloseTo(airHeavy.air.h);
    expect(bassHeavy.stops).toHaveLength(9);
    expect(new Set(bassHeavy.stops.map((stop) => Math.round(stop.color.h))).size).toBeGreaterThan(
      5,
    );
  });

  it("keeps generated colors in a restrained premium range", () => {
    const colors = spectralLightColors({
      accent: "#14ff82",
      tintA: "#5b4b80",
      tintB: "#6f5dff",
      profile: { low: 0.72, mid: 0.58, high: 0.81, peak: 0.9, active: true },
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

    expect(allColors.every((color) => !cheapBluePurple(color))).toBe(true);
    expect(allColors.every((color) => color.s <= 70)).toBe(true);
  });

  it("formats hsl colors with clamped alpha", () => {
    expect(hsla({ h: 145.4, s: 99.6, l: 54.2 }, 1.8)).toBe("hsla(145, 100%, 54%, 1.000)");
  });
});
