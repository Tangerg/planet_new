import { debounce } from "./function";
import { expect, test, vi } from "vitest";

test("debounce", () => {
  vi.useFakeTimers();

  const fn = vi.fn<(value: number) => void>();
  const fn2 = debounce(fn, 50);

  // Call multiple times rapidly; only the last call should fire after the delay
  for (let i = 0; i < 100; i++) {
    fn2(i);
  }

  // Should not have been called yet
  expect(fn).not.toHaveBeenCalled();

  // Advance time by 50ms to trigger the debounced call
  vi.advanceTimersByTime(50);

  // fn should have been called once with the last value (99)
  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith(99);

  vi.useRealTimers();
});
