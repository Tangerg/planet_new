import { describe, expectTypeOf, it } from "vitest";
import type { QueryResult, TrackKeyValue } from ".";

describe("cross-context contracts public API", () => {
  it("exports stable identity and result values without aggregates", () => {
    expectTypeOf<TrackKeyValue>().toBeString();
    expectTypeOf<QueryResult<string>>().toHaveProperty("status");
    expectTypeOf<QueryResult<string>>().not.toHaveProperty("tracks");
  });
});
