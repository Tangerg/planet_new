import { getRandomInt } from "./math";

export function shuffleArray<T>(arr: Array<T> | ReadonlyArray<T>, random: () => number): Array<T> {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    // Fisher-Yates needs j ∈ [0, i]; getRandomInt's half-open range is [0, i+1).
    const j = getRandomInt(0, i + 1, random);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Non-empty, trimmed values in first-encounter order, without duplicates.
 * Used to turn a set of entities into the id list an upstream lookup takes:
 * blank and repeated ids would either fail or waste a request.
 */
export function uniqueTrimmed(values: Iterable<string | undefined>): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    unique.push(trimmed);
  }
  return unique;
}
