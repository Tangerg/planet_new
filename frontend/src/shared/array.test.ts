import { shuffleArray } from "./array";
import { expect, test } from "vitest";

test("shuffleArray", () => {
  const arr = [1, 2, 3, 4, 5];
  const original = [...arr];
  const result = shuffleArray(arr);

  // Result has the same length
  expect(result).toHaveLength(arr.length);

  // Result contains the same elements (possibly in different order)
  expect(result.sort()).toEqual(arr.sort());

  // Original array is not mutated
  expect(arr).toEqual(original);
});
