import { expect, test } from "vitest";
import { formatDuration, Hour, Minute, Second } from "./time";

test("formatDuration", () => {
  expect(formatDuration(-1 * Second, [Hour, Minute, Second])).toBe("00:00:00");
  expect(formatDuration(1 * Second, [Hour, Minute, Second])).toBe("00:00:01");
  expect(formatDuration(1.2 * Minute, [Hour, Minute, Second])).toBe("00:01:12");
  expect(formatDuration(1.2 * Minute, [Minute, Second])).toBe("01:12");
  expect(formatDuration(1.2 * Minute, [Second])).toBe("72");
  expect(formatDuration(10 * Second, [Hour, Minute, Second])).toBe("00:00:10");
  expect(formatDuration(20 * Second, [Hour, Minute, Second])).toBe("00:00:20");
  expect(formatDuration(20 * Second, [Minute, Second])).toBe("00:20");
  expect(formatDuration(20 * Second, [Second])).toBe("20");
  expect(formatDuration(90 * Second, [Second])).toBe("90");
});
