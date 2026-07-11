import { describe, expect, it } from "vitest";

import { QueryFailedError, QueryResult } from "./QueryResult";

describe("application QueryResult", () => {
  it("keeps success, unsupported, notFound and failed as disjoint states", () => {
    const cause = new Error("offline");
    const error = new QueryFailedError("source", "search", { cause });

    expect(QueryResult.success([])).toEqual({ status: "success", data: [] });
    expect(QueryResult.unsupported()).toEqual({ status: "unsupported" });
    expect(QueryResult.notFound()).toEqual({ status: "notFound" });
    expect(QueryResult.failed(error)).toEqual({ status: "failed", error });
    expect(error.cause).toBe(cause);
  });

  it("preserves useful partial data with its individual failures", () => {
    const error = new QueryFailedError("source", "artistMusicVideos(a)", {
      cause: new Error("timeout"),
    });
    expect(QueryResult.partial(["mv"], [error])).toEqual({
      status: "partial",
      data: ["mv"],
      errors: [error],
    });
  });
});
