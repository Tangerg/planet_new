import { describe, expect, test } from "vitest";

import { categoryTransform, subItemTransform } from "./geometry";

describe("subItemTransform", () => {
  test("the active row sits at the bar offset with no bow", () => {
    expect(subItemTransform(0)).toEqual({ x: 0, y: 84 });
  });

  test("row y is exact integer stacking (below grows, above is negative)", () => {
    expect(subItemTransform(1).y).toBe(172); // 84 + 58 + 30 (after-active gap)
    expect(subItemTransform(2).y).toBe(230); // + one row
    expect(subItemTransform(-1).y).toBe(-82); // nearest passed row above the bar
    expect(subItemTransform(-2).y).toBe(-140); // + one row
  });

  test("the bow is symmetric above/below and pushes non-active rows right", () => {
    expect(subItemTransform(3).x).toBe(subItemTransform(-3).x);
    expect(subItemTransform(2).x).toBeGreaterThan(0);
  });

  test("the bow clamps far rows to a fixed offset", () => {
    expect(subItemTransform(4).x).toBe(subItemTransform(100).x);
  });
});

describe("categoryTransform", () => {
  test("the active category is upright at the crest", () => {
    expect(categoryTransform(3, 3)).toEqual({ y: 0, rotate: 0 });
  });

  test("neighbours arc up symmetrically and bank in opposite directions", () => {
    const right = categoryTransform(4, 3);
    const left = categoryTransform(2, 3);
    expect(right.y).toBe(left.y);
    expect(right.y).toBeGreaterThan(0);
    expect(right.rotate).toBe(-left.rotate);
    expect(right.rotate).not.toBe(0);
  });

  test("rotation stays within ±10° however far the offset", () => {
    for (const i of [10, 50, -30]) {
      const { rotate, y } = categoryTransform(i, 0);
      expect(rotate).toBeGreaterThanOrEqual(-10);
      expect(rotate).toBeLessThanOrEqual(10);
      expect(y).toBeGreaterThanOrEqual(0);
    }
  });
});
