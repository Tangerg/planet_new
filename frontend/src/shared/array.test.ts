import { shuffleArray, uniqueTrimmed } from "./array";
import { describe, expect, it, test } from "vitest";

test("shuffleArray", () => {
  const arr = [1, 2, 3, 4, 5];
  const original = [...arr];
  const result = shuffleArray(arr, () => 0.5);

  // Result has the same length
  expect(result).toHaveLength(arr.length);

  // Result contains the same elements (possibly in different order)
  expect(result.sort()).toEqual(arr.sort());

  // Original array is not mutated
  expect(arr).toEqual(original);
});

describe("uniqueTrimmed", () => {
  it("keeps the first occurrence of each trimmed value, in order", () => {
    expect(uniqueTrimmed(["b", " a ", "a", "b"])).toEqual(["b", "a"]);
  });

  it("drops blank and missing values rather than emitting a lookup for them", () => {
    expect(uniqueTrimmed([undefined, "", "   ", "id"])).toEqual(["id"]);
  });
});
