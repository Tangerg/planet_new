import { expect, test } from "vitest";
import { formatDuration, Hour, Minute, parseTimestamp, relativeTime, Second } from "./time";

test("relativeTime buckets an age without wording it", () => {
  const now = 400 * 24 * Hour;
  expect(relativeTime(now - 30 * Second, now)).toEqual({ unit: "now" });
  expect(relativeTime(now + Hour, now)).toEqual({ unit: "now" }); // clock skew reads as now
  expect(relativeTime(now - 5 * Minute, now)).toEqual({ unit: "minute", value: 5 });
  expect(relativeTime(now - 2 * Hour, now)).toEqual({ unit: "hour", value: 2 });
  expect(relativeTime(now - 3 * 24 * Hour, now)).toEqual({ unit: "day", value: 3 });
  const old = now - 90 * 24 * Hour;
  expect(relativeTime(old, now)).toEqual({ unit: "date", at: old });
});

test("parseTimestamp reads the fraction by its digit count, not as milliseconds", () => {
  expect(parseTimestamp("01", "23")).toBe(83 * Second);
  // The same half-second written at three precisions.
  expect(parseTimestamp("00", "12", "5")).toBe(12_500);
  expect(parseTimestamp("00", "12", "50")).toBe(12_500);
  expect(parseTimestamp("00", "12", "500")).toBe(12_500);
  // Hundredths that would read as a near-zero millisecond count.
  expect(parseTimestamp("00", "12", "57")).toBe(12_570);
  expect(parseTimestamp("00", "12", "05")).toBe(12_050);
});

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
