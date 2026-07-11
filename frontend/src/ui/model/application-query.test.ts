import { describe, expect, it } from "vitest";

import { QueryFailedError, QueryResult } from "@contexts/contracts";
import { queryDataOr, queryDataOrNull } from "./application-query";

describe("UI application-query policy", () => {
  it("uses success and partial data", () => {
    const error = new QueryFailedError("source", "read", { cause: new Error("one seed") });
    expect(queryDataOr(QueryResult.success(["a"]), [])).toEqual(["a"]);
    expect(queryDataOr(QueryResult.partial(["a"], [error]), [])).toEqual(["a"]);
  });

  it("maps unsupported/notFound to the view fallback and throws failures", () => {
    const error = new QueryFailedError("source", "read", { cause: new Error("offline") });
    expect(queryDataOr(QueryResult.unsupported<string[]>(), [])).toEqual([]);
    expect(queryDataOrNull(QueryResult.notFound<string>())).toBeNull();
    expect(() => queryDataOr(QueryResult.failed<string[]>(error), [])).toThrow(error);
  });
});
