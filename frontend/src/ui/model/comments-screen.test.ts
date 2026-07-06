import { describe, expect, it } from "vitest";

import { commentsTrackModel } from "./comments-screen";
import type { VibeTrack } from "./vibe";

const track = (overrides: Partial<VibeTrack> = {}): VibeTrack => ({
  id: "track",
  title: "Track",
  name: "Track",
  artist: "Artist",
  coverSeed: 5,
  durSec: 10,
  duration: "0:10",
  ...overrides,
});

describe("comments screen model", () => {
  it("projects track identity and art for the comments hero", () => {
    expect(
      commentsTrackModel(
        track({
          artist: "Singer",
          gradient: ["#111", "#222"],
          image: "cover.jpg",
          quality: "HQ",
        }),
      ),
    ).toMatchObject({
      artist: "Singer",
      coverSeed: 5,
      gradient: ["#111", "#222"],
      image: "cover.jpg",
      qualityLabel: "HQ",
      title: "Track",
    });
  });

  it("uses conservative fallbacks without a current track", () => {
    expect(commentsTrackModel(undefined)).toEqual({
      artist: "",
      coverSeed: 0,
      gradient: undefined,
      image: undefined,
      images: undefined,
      qualityLabel: "SQ",
      title: "",
    });
  });
});
