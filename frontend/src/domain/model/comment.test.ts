import { describe, expect, test } from "vitest";
import { Comment } from "./comment";
import type { Comment as CommentModel } from "./comment";

const comment = (id: string, content = id): CommentModel => ({
  id,
  user: { name: "listener" },
  content,
  likedCount: 0,
  time: 0,
});

describe("Comment", () => {
  test("merges prioritized threads and keeps the first occurrence of each id", () => {
    expect(
      Comment.mergeThreads(
        [comment("1", "hot"), comment("2", "also hot")],
        [comment("1", "recent duplicate"), comment("3", "recent")],
      ),
    ).toEqual([comment("1", "hot"), comment("2", "also hot"), comment("3", "recent")]);
  });

  test("drops comments without provider ids and honors the limit", () => {
    expect(Comment.mergeThreads([comment(""), comment("1"), comment("2")], [], 1)).toEqual([
      comment("1"),
    ]);
  });
});
