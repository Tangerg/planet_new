import { describe, expect, test } from "vitest";
import { getNumberInRange, getRandomInt, getRandomIntExclude } from "./math";

describe("getRandomInt", () => {
  test("stays within the half-open range", () => {
    for (let i = 0; i < 100; i++) {
      const n = getRandomInt(0, 5);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(5);
    }
  });

  test("throws when min >= max", () => {
    expect(() => getRandomInt(5, 5)).toThrow();
  });
});

describe("getRandomIntExclude", () => {
  test("never returns the excluded value", () => {
    for (let i = 0; i < 100; i++) {
      expect(getRandomIntExclude(0, 5, 2)).not.toBe(2);
    }
  });

  test("throws when no candidate remains after exclusion", () => {
    expect(() => getRandomIntExclude(0, 1, 0)).toThrow();
  });
});

describe("getNumberInRange", () => {
  test("clamps to the range", () => {
    expect(getNumberInRange(0, 5, 10)).toBe(5);
    expect(getNumberInRange(0, 5, -10)).toBe(0);
    expect(getNumberInRange(0, 5, 3)).toBe(3);
  });

  test("returns the bound when the range is a single point", () => {
    expect(getNumberInRange(1, 1, 2)).toBe(1);
    expect(getNumberInRange(1, 1, 1)).toBe(1);
  });

  test("throws when min > max", () => {
    expect(() => getNumberInRange(1, 0, 1)).toThrow();
  });
});
