import { describe, expect, test } from "vitest";
import { clamp, getRandomInt } from "./math";

describe("getRandomInt", () => {
  test("stays within the half-open range", () => {
    for (let i = 0; i < 100; i++) {
      const n = getRandomInt(0, 5, Math.random);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(5);
    }
  });

  test("throws when min >= max", () => {
    expect(() => getRandomInt(5, 5, Math.random)).toThrow("min must be less than max");
  });
});

describe("clamp", () => {
  test("clamps to the range", () => {
    expect(clamp(0, 5, 10)).toBe(5);
    expect(clamp(0, 5, -10)).toBe(0);
    expect(clamp(0, 5, 3)).toBe(3);
  });

  test("returns the bound when the range is a single point", () => {
    expect(clamp(1, 1, 2)).toBe(1);
    expect(clamp(1, 1, 1)).toBe(1);
  });

  test("throws when min > max", () => {
    expect(() => clamp(1, 0, 1)).toThrow("min must be less than or equal to max");
  });
});
