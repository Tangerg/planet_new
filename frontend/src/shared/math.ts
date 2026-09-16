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
