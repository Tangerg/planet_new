import { describe, expect, it } from "vitest";

import { fakeKy } from "./fake-ky";
import { fetchNcmPersonalized, fetchNcmToplists } from "./catalog";

const unavailable = () => {
  throw new Error("upstream unavailable");
};

describe("NCM catalog error semantics", () => {
  it("keeps useful personalized sections when sibling requests fail", async () => {
    const { http } = fakeKy({
      personalized: { result: [{ id: 1, name: "Playlist" }] },
      "album/newest": unavailable,
      "top/artists": unavailable,
      "personalized/newsong": unavailable,
    });

    await expect(fetchNcmPersonalized(http)).resolves.toMatchObject({
      playlists: [{ id: "1", name: "Playlist" }],
      albums: [],
      artists: [],
      tracks: [],
    });
  });

  it("fails personalized content when every section fails", async () => {
    const { http } = fakeKy({
      personalized: unavailable,
      "album/newest": unavailable,
      "top/artists": unavailable,
      "personalized/newsong": unavailable,
    });

    await expect(fetchNcmPersonalized(http)).rejects.toThrow("NCM personalized sections failed");
  });

  it("propagates a toplist request failure", async () => {
    const { http } = fakeKy({ toplist: unavailable });

    await expect(fetchNcmToplists(http)).rejects.toThrow("upstream unavailable");
  });
});
