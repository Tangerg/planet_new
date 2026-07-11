import { describe, expect, test } from "vitest";
import { ProviderId } from "@domain";

import { queryKeys } from "./queryKeys";

describe("queryKeys", () => {
  test("keeps provider-scoped account and library keys consistent", () => {
    expect(queryKeys.accountRoot()).toEqual(["account"]);
    const providerId = ProviderId.of("netease");
    expect(queryKeys.account(providerId)).toEqual(["account", "netease"]);
    expect(queryKeys.likedIds(providerId)).toEqual(["likedIds", "netease"]);
  });

  test("copies array segments so callers cannot mutate a stored key", () => {
    const ids = ["a", "b"];
    const key = queryKeys.musicVideoDiscovery(ProviderId.of("netease"), ids);
    ids.push("c");

    expect(key).toEqual(["musicVideos", "artistDiscovery", "netease", ["a", "b"]]);
  });

  test("keeps identical provider-local entity ids in different cache namespaces", () => {
    const netease = ProviderId.of("netease");
    const qqmusic = ProviderId.of("qqmusic");

    expect(queryKeys.detail(netease, "Album", "42")).not.toEqual(
      queryKeys.detail(qqmusic, "Album", "42"),
    );
    expect(queryKeys.artist(netease, "42")).not.toEqual(queryKeys.artist(qqmusic, "42"));
    expect(queryKeys.musicVideo(netease, "42")).not.toEqual(queryKeys.musicVideo(qqmusic, "42"));
    expect(queryKeys.comments(netease, "42")).not.toEqual(queryKeys.comments(qqmusic, "42"));
  });
});
