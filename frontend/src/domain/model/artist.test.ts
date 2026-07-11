import { describe, expect, test } from "vitest";
import { Artist } from "./artist";
import { ProviderId } from "./provider-id";

const TEST_PROVIDER_ID = ProviderId.of("test");

describe("Artist", () => {
  test("keeps unique provider lookup ids in encounter order", () => {
    expect(
      Artist.uniqueIds([{ id: "a" }, { id: " " }, {}, { id: "b" }, { id: "a" }, { id: "c" }], 2),
    ).toEqual(["a", "b"]);
  });

  test("exposes hot tracks as a never-undefined list", () => {
    expect(Artist.hotTracks({})).toEqual([]);
    const top = [
      { providerId: TEST_PROVIDER_ID, id: "t1", name: "Song", durationMs: 1, artists: [] },
    ];
    expect(Artist.hotTracks({ topTracks: top })).toBe(top);
  });
});
