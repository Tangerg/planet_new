/**
 * Random integer in the half-open range [min, max) (array-index friendly).
 * @throws if min >= max
 */
export function getRandomInt(min: number, max: number, random: () => number): number {
  if (min >= max) {
    throw new Error("min must be less than max");
  }
  return Math.floor(random() * (max - min)) + min;
}

/**
 * Clamp `expect` into the closed range [min, max].
 * @param min lower bound; returned when expect is smaller
 * @param max upper bound; returned when expect is larger
 * @param expect the desired value within the range
 */
export function clamp(min: number, max: number, expect: number): number {
  if (min > max) {
    throw new Error("min must be less than or equal to max");
  }
  if (expect < min) {
    return min;
  }
  if (expect > max) {
    return max;
  }
  return expect;
}
