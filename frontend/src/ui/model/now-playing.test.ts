import { describe, expect, it } from "vitest";

import type { Lyric } from "@domain/model/lyric";

import {
  isNowPlayingCommentsMode,
  isNowPlayingLyricsMode,
  isNowPlayingPanelOpen,
  lyricLinesOrFallback,
  nowPlayingCredits,
  nowPlayingTrackModel,
  swipeAction,
  toggleNowPlayingLyricsMode,
} from "./now-playing";
import type { VibeTrack } from "./vibe";

const track = (overrides: Partial<VibeTrack> = {}): VibeTrack => ({
  id: "track",
  title: "Track",
  name: "Track",
  artist: "Artist",
  coverSeed: 8,
  durSec: 10,
  duration: "0:10",
  ...overrides,
});

describe("now-playing model", () => {
  it("provides a stable no-lyrics fallback", () => {
    expect(lyricLinesOrFallback([], "No lyrics")).toEqual([{ content: "No lyrics", duration: 0 }]);
  });

  it("copies provided lyric lines", () => {
    const lines: Lyric[] = [{ content: "A", duration: 1000 }];
    const result = lyricLinesOrFallback(lines, "No lyrics");

    expect(result).toEqual(lines);
    expect(result).not.toBe(lines);
  });

  it("derives now-playing modes", () => {
    expect(isNowPlayingLyricsMode("lyrics")).toBe(true);
    expect(isNowPlayingCommentsMode("comments")).toBe(true);
    expect(isNowPlayingPanelOpen("cover")).toBe(false);
    expect(isNowPlayingPanelOpen("lyrics")).toBe(true);
    expect(toggleNowPlayingLyricsMode("lyrics")).toBe("cover");
    expect(toggleNowPlayingLyricsMode("cover")).toBe("lyrics");
  });

  it("formats credits without leaking missing fields", () => {
    expect(nowPlayingCredits(undefined)).toEqual([]);
    expect(nowPlayingCredits({ music: "A" })).toEqual([
      { key: "player.writtenBy", values: { name: "A" } },
    ]);
    expect(nowPlayingCredits({ producer: "B" })).toEqual([
      { key: "player.producedBy", values: { name: "B" } },
    ]);
    expect(nowPlayingCredits({ music: "A", producer: "B" })).toEqual([
      { key: "player.writtenBy", values: { name: "A" } },
      { key: "player.producedBy", values: { name: "B" } },
    ]);
  });

  it("projects the current track into display-safe now-playing metadata", () => {
    expect(
      nowPlayingTrackModel(
        track({
          artist: "Singer",
          artistId: "artist",
          credits: { producer: "Producer" },
          gradient: ["#111", "#222"],
          image: "cover.jpg",
          quality: "SQ",
        }),
      ),
    ).toMatchObject({
      artist: "Singer",
      artistId: "artist",
      coverSeed: 8,
      credits: [{ key: "player.producedBy", values: { name: "Producer" } }],
      gradient: ["#111", "#222"],
      image: "cover.jpg",
      quality: "SQ",
      title: "Track",
    });

    expect(nowPlayingTrackModel(undefined)).toMatchObject({
      artist: "",
      coverSeed: 0,
      credits: [],
      title: "",
    });
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
