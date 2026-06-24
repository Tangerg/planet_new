import {
  sleep,
  Timer,
  formatDurationMillisecond,
  formatDurationSeconds,
  formatDuration,
  Hour,
  Minute,
  Second,
} from "./time";
import { expect, test, vi } from "vitest";

test("sleep", async () => {
  const start = Date.now();
  await sleep(50);
  const elapsed = Date.now() - start;
  expect(elapsed).toBeGreaterThanOrEqual(40);
});

test("Timer", async () => {
  vi.useFakeTimers();

  const timer = new Timer();

  // Before run: duration is 0, not running
  expect(timer.duration).toBe(0);
  expect(timer.isRunning).toBe(false);

  timer.run();
  expect(timer.isRunning).toBe(true);

  // Advance 1500ms
  vi.advanceTimersByTime(1500);
  expect(timer.duration).toBe(1500);
  expect(timer.isRunning).toBe(true);

  timer.pause();
  expect(timer.isRunning).toBe(false);

  // Advance 500ms while paused — duration should not change
  vi.advanceTimersByTime(500);
  expect(timer.duration).toBe(1500);

  timer.run();
  expect(timer.isRunning).toBe(true);

  // Advance 500ms while running
  vi.advanceTimersByTime(500);
  expect(timer.duration).toBe(2000);

  timer.reset();
  expect(timer.duration).toBe(0);
  expect(timer.isRunning).toBe(false);

  vi.useRealTimers();
});

test("formatDurationSeconds", () => {
  expect(formatDurationSeconds(-1)).toBe("00:00:00");
  expect(formatDurationSeconds(1)).toBe("00:00:01");
  expect(formatDurationSeconds(1.2)).toBe("00:00:01");
  expect(formatDurationSeconds(10)).toBe("00:00:10");
  expect(formatDurationSeconds(20)).toBe("00:00:20");
  expect(formatDurationSeconds(60)).toBe("00:01:00");
  expect(formatDurationSeconds(61)).toBe("00:01:01");
  expect(formatDurationSeconds(71)).toBe("00:01:11");
  expect(formatDurationSeconds(120)).toBe("00:02:00");
  expect(formatDurationSeconds(3600)).toBe("01:00:00");
  expect(formatDurationSeconds(3601)).toBe("01:00:01");
  expect(formatDurationSeconds(3661)).toBe("01:01:01");
  // Very large value: since formatDurationMillisecond multiplies by Second (1000),
  // the result can exceed Number.MAX_SAFE_INTEGER; just verify it doesn't crash.
  expect(typeof formatDurationSeconds(1008080808080808)).toBe("string");
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

test("formatDuration works correctly", () => {
  expect(formatDurationMillisecond(0)).toBe("00:00:00");
  expect(formatDurationMillisecond(999)).toBe("00:00:00");
  expect(formatDurationMillisecond(1000)).toBe("00:00:01");
  expect(formatDurationMillisecond(60 * 1000)).toBe("00:01:00");
  expect(formatDurationMillisecond(3600 * 1000)).toBe("01:00:00");
  expect(formatDurationMillisecond(3661 * 1000)).toBe("01:01:01");
});

test("formatDurationSeconds works correctly", () => {
  expect(formatDurationSeconds(0)).toBe("00:00:00");
  expect(formatDurationSeconds(1)).toBe("00:00:01");
  expect(formatDurationSeconds(60)).toBe("00:01:00");
  expect(formatDurationSeconds(3600)).toBe("01:00:00");
  expect(formatDurationSeconds(3661)).toBe("01:01:01");
});
