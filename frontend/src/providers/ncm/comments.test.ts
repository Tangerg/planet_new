import { describe, expect, test } from "vitest";

import { fakeKy } from "./fake-ky";
import { fetchNcmMusicVideoComments, fetchNcmTrackComments } from "./comments";

describe("fetchNcmTrackComments", () => {
  test("merges hot and recent lanes, deduping by id (hot wins)", async () => {
    const { http, calls } = fakeKy({
      "comment/music": {
        hotComments: [
          { commentId: 1, content: "h1" },
          { commentId: 2, content: "h2" },
        ],
        comments: [
          { commentId: 2, content: "dup" },
          { commentId: 3, content: "c3" },
        ],
      },
    });
    const comments = await fetchNcmTrackComments(http, "t1");
    expect(comments.map((c) => c.id)).toEqual(["1", "2", "3"]);
    // The hot-lane copy of id 2 is kept, not the recent-lane duplicate.
    expect(comments.find((c) => c.id === "2")?.content).toBe("h2");
    expect(calls[0]).toMatchObject({ path: "comment/music", searchParams: { id: "t1" } });
  });

  test("propagates request failures to the engagement result boundary", async () => {
    const { http } = fakeKy({
      "comment/music": () => {
        throw new Error("down");
      },
    });
    await expect(fetchNcmTrackComments(http, "t1")).rejects.toThrow("down");
  });
});

describe("fetchNcmMusicVideoComments", () => {
  test("queries the mv comment endpoint", async () => {
    const { http, calls } = fakeKy({ "comment/mv": { hotComments: [{ commentId: 9 }] } });
    const comments = await fetchNcmMusicVideoComments(http, "mv1");
    expect(comments.map((c) => c.id)).toEqual(["9"]);
    expect(calls[0]).toMatchObject({ path: "comment/mv", searchParams: { id: "mv1" } });
  });
});
