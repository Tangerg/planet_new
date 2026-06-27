import { describe, expect, test } from "vitest";
import { Volume } from "./volume";

describe("Volume", () => {
  test("of() clamps and rounds to 0..100", () => {
    expect(Volume.of(150).level).toBe(100);
    expect(Volume.of(-10).level).toBe(0);
    expect(Volume.of(42.6).level).toBe(43);
  });

  test("muted reflects level === 0", () => {
    expect(Volume.of(0).muted).toBe(true);
    expect(Volume.of(20).muted).toBe(false);
  });

  test("set() clamps and is immutable", () => {
    const a = Volume.of(50);
    const b = a.set(80);
    expect(a.level).toBe(50);
    expect(b.level).toBe(80);
    expect(b.set(999).level).toBe(100);
  });

  test("toggleMute() mutes to 0 then restores the prior level", () => {
    const v = Volume.of(70);
    const muted = v.toggleMute();
    expect(muted.level).toBe(0);
    expect(muted.muted).toBe(true);
    expect(muted.toggleMute().level).toBe(70);
  });

  test("unmute from a started-muted volume restores the default 30", () => {
    expect(Volume.of(0).toggleMute().level).toBe(30);
  });

  test("set() preserves the restore target across a drop to zero", () => {
    // 60 → set 0 → unmute should return to 60, not the default.
    const restored = Volume.of(60).set(0).toggleMute();
    expect(restored.level).toBe(60);
  });
});
