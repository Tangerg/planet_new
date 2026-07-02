import { describe, expect, it } from "vitest";

import type { Lyric } from "@domain/model/lyric";

import { lyricLinesOrFallback } from "./now-playing";

describe("now-playing model", () => {
  it("provides a stable no-lyrics fallback", () => {
    expect(lyricLinesOrFallback([])).toEqual([
      { content: "No lyrics for this track.", duration: 0 },
    ]);
  });

  it("copies provided lyric lines", () => {
    const lines: Lyric[] = [{ content: "A", duration: 1000 }];
    const result = lyricLinesOrFallback(lines);

    expect(result).toEqual(lines);
    expect(result).not.toBe(lines);
  });
});
