import { getRandomInt } from "./math";

export function shuffleArray<T>(arr: Array<T> | ReadonlyArray<T>): Array<T> {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    // Fisher-Yates needs j ∈ [0, i]; getRandomInt's half-open range is [0, i+1).
    const j = getRandomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
