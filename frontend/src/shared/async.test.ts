import { describe, expect, it } from "vitest";

import { mapConcurrent, pageOffsets } from "./async";

/** Resolves once `release()` is called, recording how many are in flight. */
function tracker() {
  let inFlight = 0;
  let peak = 0;
  const pending: Array<() => void> = [];
  return {
    get peak() {
      return peak;
    },
    task: (value: number) =>
      new Promise<number>((resolve) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        pending.push(() => {
          inFlight -= 1;
          resolve(value * 2);
        });
      }),
    flush() {
      while (pending.length) pending.shift()!();
    },
  };
}

describe("mapConcurrent", () => {
  it("returns results in input order, not completion order", async () => {
    const results = await mapConcurrent([10, 20, 30, 40], 2, async (value, index) => {
      // The later items settle first.
      await new Promise((resolve) => setTimeout(resolve, 4 - index));
      return value + index;
    });
    expect(results).toEqual([10, 21, 32, 43]);
  });

  it("never exceeds the concurrency limit", async () => {
    const t = tracker();
    const run = mapConcurrent([1, 2, 3, 4, 5, 6, 7], 3, t.task);
    await Promise.resolve();
    expect(t.peak).toBe(3);
    // Drain repeatedly: each release lets a queued item start.
    for (let i = 0; i < 8; i++) {
      t.flush();
      await Promise.resolve();
    }
    await expect(run).resolves.toEqual([2, 4, 6, 8, 10, 12, 14]);
    expect(t.peak).toBe(3);
  });

  it("runs everything at once when the limit exceeds the item count", async () => {
    const t = tracker();
    const run = mapConcurrent([1, 2], 10, t.task);
    await Promise.resolve();
    expect(t.peak).toBe(2);
    t.flush();
    await expect(run).resolves.toEqual([2, 4]);
  });

  it("rejects when a task throws, like Promise.all", async () => {
    await expect(
      mapConcurrent([1, 2, 3], 2, async (value) => {
        if (value === 2) throw new Error("boom");
        return value;
      }),
    ).rejects.toThrow("boom");
  });

  it("does no work for an empty list", async () => {
    let calls = 0;
    await expect(
      mapConcurrent([], 4, async () => {
        calls += 1;
        return 1;
      }),
    ).resolves.toEqual([]);
    expect(calls).toBe(0);
  });

  it("treats a non-positive limit as one at a time", async () => {
    const t = tracker();
    const run = mapConcurrent([1, 2, 3], 0, t.task);
    await Promise.resolve();
    expect(t.peak).toBe(1);
    for (let i = 0; i < 4; i++) {
      t.flush();
      await Promise.resolve();
    }
    await expect(run).resolves.toEqual([2, 4, 6]);
  });
});

describe("pageOffsets", () => {
  it("covers the total in whole pages", () => {
    expect(pageOffsets(1000, 500)).toEqual([0, 500]);
    expect(pageOffsets(1001, 500)).toEqual([0, 500, 1000]);
    expect(pageOffsets(1, 500)).toEqual([0]);
  });

  it("has nothing to page when the total is empty or unknown", () => {
    expect(pageOffsets(0, 500)).toEqual([]);
    expect(pageOffsets(-1, 500)).toEqual([]);
    expect(pageOffsets(10, 0)).toEqual([]);
  });
});
