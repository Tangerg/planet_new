import { expect, test } from "vitest";
import { Repeat, RepeatMode } from "./repeat";

test("repeat", () => {
  const repeat = new Repeat();

  // Initial mode is OFF
  expect(repeat.current).toBe(RepeatMode.OFF);

  // next() returns ONE
  expect(repeat.next()).toBe(RepeatMode.ONE);
  expect(repeat.current).toBe(RepeatMode.ONE);

  // next() after ONE returns ALL
  expect(repeat.next()).toBe(RepeatMode.ALL);

  // Cycling back returns OFF then continues cycling
  expect(repeat.next()).toBe(RepeatMode.OFF);
  expect(repeat.next()).toBe(RepeatMode.ONE);
  expect(repeat.next()).toBe(RepeatMode.ALL);

  // Final next() returns to OFF, completing the cycle
  expect(repeat.next()).toBe(RepeatMode.OFF);
});
