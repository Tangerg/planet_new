/**
 * Random integer in the half-open range [min, max) (array-index friendly).
 * @throws if min >= max
 */
export function getRandomInt(min: number, max: number): number {
  if (min >= max) {
    throw new Error("min must be less than max");
  }
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Random integer in [min, max), excluding a specific value.
 * @throws if `exclude` is the only remaining candidate in the range
 */
export function getRandomIntExclude(min: number, max: number, exclude: number): number {
  if (max - min <= 1 && Math.floor(exclude) === Math.floor(min)) {
    throw new Error("no candidate available after exclusion");
  }
  let random = getRandomInt(min, max);
  while (random === exclude) {
    random = getRandomInt(min, max);
  }
  return random;
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
