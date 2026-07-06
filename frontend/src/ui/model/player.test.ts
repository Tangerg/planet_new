import { describe, expect, it } from "vitest";

import {
  clampVolume,
  likedShortcutTarget,
  nextVolumeLevel,
  repeatTooltip,
  volumeFromSliderValue,
  volumeLevel,
  volumeSliderValue,
} from "./player";

describe("player model", () => {
  it("maps volume to semantic levels", () => {
    expect(volumeLevel(0)).toBe("muted");
    expect(volumeLevel(50)).toBe("low");
    expect(volumeLevel(51)).toBe("high");
  });

  it("clamps and steps volume commands within the player scale", () => {
    expect(clampVolume(-10)).toBe(0);
    expect(clampVolume(101)).toBe(100);
    expect(clampVolume(55.4)).toBe(55);
    expect(nextVolumeLevel(98, "up")).toBe(100);
    expect(nextVolumeLevel(2, "down")).toBe(0);
    expect(nextVolumeLevel(50, "up", 10)).toBe(60);
  });

  it("derives slider values on the player scale", () => {
    expect(volumeSliderValue(25)).toBe(0.25);
    expect(volumeSliderValue(140)).toBe(1);
    expect(volumeFromSliderValue(0.365)).toBe(37);
    expect(volumeFromSliderValue(undefined)).toBe(0);
  });

  it("only exposes a liked shortcut target when a track is current", () => {
    expect(likedShortcutTarget(undefined)).toBeNull();
    expect(likedShortcutTarget("track")).toBe("track");
  });

  it("names the next repeat action", () => {
    expect(repeatTooltip(false, false)).toBe("player.enableRepeat");
    expect(repeatTooltip(true, false)).toBe("player.enableRepeatOne");
    expect(repeatTooltip(true, true)).toBe("player.disableRepeat");
  });
});
