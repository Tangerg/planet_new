import { describe, expect, test } from "vitest";
import { RepeatMode, nextRepeatMode } from "./repeat";

describe("nextRepeatMode", () => {
  test("cycles Off → All → One → Off", () => {
    expect(nextRepeatMode(RepeatMode.OFF)).toBe(RepeatMode.ALL);
    expect(nextRepeatMode(RepeatMode.ALL)).toBe(RepeatMode.ONE);
    expect(nextRepeatMode(RepeatMode.ONE)).toBe(RepeatMode.OFF);
  });
});
