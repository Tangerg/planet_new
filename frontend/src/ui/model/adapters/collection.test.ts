import { describe, expect, it } from "vitest";
import { ProviderId } from "@domain/model/provider-id";

import { toVibePlaylists } from "./collection";

describe("collection projection boundary", () => {
  it("projects optional playlists into vibe collections", () => {
    expect(
      toVibePlaylists([
        {
          providerId: ProviderId.of("test"),
          id: "p1",
          name: "Daily",
          owner: { id: "u1", displayName: "Alice" },
          images: [{ url: "cover.jpg" }],
          totalTracks: 12,
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        id: "p1",
        name: "Daily",
        kind: "Playlist",
        owner: "Alice",
        image: "cover.jpg",
        trackCount: 12,
      }),
    ]);
  });

  it("uses an empty collection list for missing data", () => {
    expect(toVibePlaylists()).toEqual([]);
  });
});
