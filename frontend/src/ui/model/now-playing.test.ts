import { describe, expect, it } from "vitest";

import { activeLyricIndex, lyricLinesOrFallback, type LyricLine } from "./now-playing";

describe("now-playing model", () => {
  it("provides a stable no-lyrics fallback", () => {
    expect(lyricLinesOrFallback([])).toEqual([{ line: "No lyrics for this track." }]);
  });

  it("copies provided lyric lines", () => {
    const lines: LyricLine[] = [{ line: "A", t: 1000 }];
    const result = lyricLinesOrFallback(lines);

    expect(result).toEqual(lines);
    expect(result).not.toBe(lines);
  });

  it("finds the latest lyric line at or before the current position", () => {
    const lines: LyricLine[] = [
      { line: "A", t: 0 },
      { line: "B", t: 5_000 },
      { line: "C", t: 12_000 },
    ];

    expect(activeLyricIndex(lines, 0)).toBe(0);
    expect(activeLyricIndex(lines, 6)).toBe(1);
    expect(activeLyricIndex(lines, 99)).toBe(2);
  });

  it("uses the first line when lyrics are untimed", () => {
    expect(activeLyricIndex([{ line: "untimed" }], 99)).toBe(0);
  });
});
