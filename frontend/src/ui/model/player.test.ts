import { describe, expect, it } from "vitest";

import { effectiveDuration, playbackPosition, repeatTooltip, volumeLevel } from "./player";

describe("player model", () => {
  it("derives effective duration from kernel duration with metadata fallback", () => {
    expect(effectiveDuration(240, 120)).toBe(240);
    expect(effectiveDuration(0, 120)).toBe(120);
    expect(effectiveDuration(0, undefined)).toBe(1);
  });

  it("uses scrub position while dragging and clamps live position to duration", () => {
    expect(playbackPosition(42, 240, 10)).toBe(10);
    expect(playbackPosition(280, 240, null)).toBe(240);
  });

  it("maps volume to semantic levels", () => {
    expect(volumeLevel(0)).toBe("muted");
    expect(volumeLevel(50)).toBe("low");
    expect(volumeLevel(51)).toBe("high");
  });

  it("names the next repeat action", () => {
    expect(repeatTooltip(false, false)).toBe("Enable repeat");
    expect(repeatTooltip(true, false)).toBe("Enable repeat one");
    expect(repeatTooltip(true, true)).toBe("Disable repeat");
  });
});
