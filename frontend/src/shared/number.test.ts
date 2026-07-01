import { expect, test } from "vitest";
import { compactCount } from "./number";

test("compactCount", () => {
  expect(compactCount(undefined)).toBe("0");
  expect(compactCount(-10)).toBe("0");
  expect(compactCount(999)).toBe("999");
  expect(compactCount(1_200)).toBe("1.2K");
  expect(compactCount(12_000)).toBe("12K");
  expect(compactCount(1_250_000)).toBe("1.3M");
});
