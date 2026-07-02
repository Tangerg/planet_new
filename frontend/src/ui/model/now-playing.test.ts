import { describe, expect, it } from "vitest";

import type { Lyric } from "@domain/model/lyric";

import { lyricLinesOrFallback, swipeAction } from "./now-playing";

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

describe("swipeAction", () => {
  it("ignores drags below the threshold", () => {
    expect(swipeAction(20, 0)).toBeNull();
    expect(swipeAction(-39, 39)).toBeNull();
  });

  it("skips tracks on a dominant horizontal swipe (left = next, right = prev)", () => {
    expect(swipeAction(-80, 10)).toBe("next");
    expect(swipeAction(80, -10)).toBe("prev");
  });

  it("opens lyrics on up and the queue on down for a dominant vertical swipe", () => {
    expect(swipeAction(10, -80)).toBe("up");
    expect(swipeAction(-10, 80)).toBe("down");
  });

  it("resolves exact-magnitude ties to the vertical axis (only strict horizontal skips)", () => {
    expect(swipeAction(50, 50)).toBe("down");
    expect(swipeAction(50, -50)).toBe("up");
  });
});
