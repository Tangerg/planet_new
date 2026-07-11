import { describe, expect, it } from "vitest";

import { requireSomeSettled, settledOr } from "./settled";

function captureAggregateError(run: () => void): AggregateError {
  try {
    run();
  } catch (error) {
    if (error instanceof AggregateError) return error;
    throw error;
  }
  throw new Error("Expected AggregateError");
}

describe("settled provider sections", () => {
  it("keeps fulfilled data and substitutes only rejected sections", async () => {
    const [success, failure] = await Promise.allSettled([
      Promise.resolve(["data"]),
      Promise.reject(new Error("down")),
    ]);

    expect(settledOr(success, [])).toEqual(["data"]);
    expect(settledOr(failure, [])).toEqual([]);
    expect(() => requireSomeSettled("discovery", [success, failure])).not.toThrow();
  });

  it("retains all causes when every section fails", async () => {
    const results = await Promise.allSettled([
      Promise.reject(new Error("first")),
      Promise.reject(new Error("second")),
    ]);

    expect(() => requireSomeSettled("discovery", results)).toThrow("discovery failed");
    const error = captureAggregateError(() => requireSomeSettled("discovery", results));
    expect(error.errors).toHaveLength(2);
  });
});
