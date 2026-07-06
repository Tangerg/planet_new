import { describe, expect, it } from "vitest";

import type { Comment } from "@domain/model/comment";

import { toVibeComments } from "./comment";

describe("comment projection boundary", () => {
  it("projects domain comments into vibe comments", () => {
    const comments: Comment[] = [
      {
        id: "c1",
        user: { name: "Alice", avatar: [{ url: "avatar.jpg" }] },
        content: "Still glowing",
        likedCount: 9,
        time: 1_700_000_000_000,
      },
    ];

    expect(toVibeComments(comments)).toEqual([
      expect.objectContaining({
        id: "c1",
        name: "Alice",
        avatar: [{ url: "avatar.jpg" }],
        content: "Still glowing",
        likedCount: 9,
      }),
    ]);
  });

  it("uses an empty comment list for missing data", () => {
    expect(toVibeComments()).toEqual([]);
  });
});
