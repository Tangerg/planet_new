import { describe, expect, test } from "vitest";

import { queryKeys } from "./queryKeys";

describe("queryKeys", () => {
  test("keeps provider-scoped account and library keys consistent", () => {
    expect(queryKeys.accountRoot()).toEqual(["account"]);
    expect(queryKeys.account("ncm")).toEqual(["account", "ncm"]);
    expect(queryKeys.likedIds("ncm")).toEqual(["likedIds", "ncm"]);
  });

  test("copies array segments so callers cannot mutate a stored key", () => {
    const ids = ["a", "b"];
    const key = queryKeys.musicVideoDiscovery("ncm", ids);
    ids.push("c");

    expect(key).toEqual(["musicVideos", "artistDiscovery", "ncm", ["a", "b"]]);
  });
});
