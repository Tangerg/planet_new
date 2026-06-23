import { shuffleArray } from "./array";
import { test } from "vitest";
test("shuffleArray", () => {
  const arr = Array.from([1, 2, 3, 4, 5]);
  const arr1 = shuffleArray(arr);
  console.log(arr1);
});
