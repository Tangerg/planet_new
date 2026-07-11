import { describe, expect, it } from "vitest";

import { fakeKy } from "./fake-ky";
import { searchNcm } from "./search";

describe("NCM search error semantics", () => {
  it("keeps fulfilled result types when other search sections fail", async () => {
    const { http } = fakeKy({
      cloudsearch: (params: Record<string, unknown>) => {
        if (params.type === 1) return { result: { songs: [{ id: 1, name: "Track" }] } };
        throw new Error(`type ${params.type} unavailable`);
      },
    });

    await expect(searchNcm(http, "track")).resolves.toMatchObject({
      tracks: [{ id: "1", name: "Track" }],
      artists: [],
      albums: [],
      playlists: [],
    });
  });

  it("fails when every search section fails", async () => {
    const { http } = fakeKy({
      cloudsearch: () => {
        throw new Error("search unavailable");
      },
    });

    await expect(searchNcm(http, "track")).rejects.toThrow("NCM search sections failed");
  });
});
