import { describe, expect, it } from "vitest";

import type { ScreenData, VibeCollection, VibeTrack } from "./vibe";
import {
  dailyMixCollection,
  featuredForYouCollection,
  forYouCollectionRoute,
  forYouScreenModel,
  forYouTiles,
  timeOfDayGreeting,
} from "./for-you";

const track = (id: string): VibeTrack => ({
  id,
  title: id,
  name: id,
  artist: "Artist",
  coverSeed: 11,
  gradient: ["#111", "#222"],
  image: `${id}.jpg`,
  durSec: 10,
  duration: "0:10",
});

const collection = (
  id: string,
  kind = "Playlist",
  overrides: Partial<VibeCollection> = {},
): VibeCollection => ({
  id,
  name: id,
  kind,
  coverSeed: 1,
  tracks: [],
  ...overrides,
});

const screenData = (overrides: Partial<ScreenData> = {}): ScreenData => ({
  playlists: [collection("p1"), collection("p2")],
  albums: [collection("a1", "Album", { artist: "Artist" })],
  artists: [{ id: "ar1", name: "Artist", coverSeed: 3 }],
  allTracks: [],
  ...overrides,
});

describe("for you screen model", () => {
  it("derives a greeting from the current hour", () => {
    expect(timeOfDayGreeting(new Date("2026-01-01T03:00:00"))).toBe("Late night");
    expect(timeOfDayGreeting(new Date("2026-01-01T08:00:00"))).toBe("Good morning");
    expect(timeOfDayGreeting(new Date("2026-01-01T14:00:00"))).toBe("Good afternoon");
    expect(timeOfDayGreeting(new Date("2026-01-01T21:00:00"))).toBe("Good evening");
  });

  it("builds a synthetic daily mix without requiring provider detail fetch", () => {
    expect(dailyMixCollection([track("t1")])).toMatchObject({
      id: "daily-mix",
      name: "Daily Mix",
      kind: "Playlist",
      owner: "For You",
      coverSeed: 11,
      image: "t1.jpg",
      fetchDetail: false,
      tracks: [{ id: "t1" }],
    });
    expect(dailyMixCollection([])).toBeUndefined();
  });

  it("uses daily mix as featured, then falls back to curated playlists", () => {
    expect(featuredForYouCollection(screenData(), [track("t1")])?.id).toBe("daily-mix");
    expect(featuredForYouCollection(screenData(), [])?.id).toBe("p2");
    expect(featuredForYouCollection(screenData({ playlists: [collection("only")] }), [])?.id).toBe(
      "only",
    );
  });

  it("limits quick tiles to playlists followed by albums", () => {
    const data = screenData({
      playlists: Array.from({ length: 6 }, (_, index) => collection(`p${index}`)),
      albums: Array.from({ length: 6 }, (_, index) => collection(`a${index}`, "Album")),
    });

    expect(forYouTiles(data).map((item) => item.id)).toEqual([
      "p0",
      "p1",
      "p2",
      "p3",
      "p4",
      "p5",
      "a0",
      "a1",
    ]);
  });

  it("routes albums and playlists to their matching detail screens", () => {
    expect(forYouCollectionRoute(collection("a1", "Album", { artist: "Artist" }))).toBe("album");
    expect(forYouCollectionRoute(collection("p1", "Playlist"))).toBe("playlist");
  });

  it("collects the full home model for the screen", () => {
    const model = forYouScreenModel(screenData(), [track("t1")], new Date("2026-01-01T21:00:00"));

    expect(model).toMatchObject({
      greeting: "Good evening",
      featured: { id: "daily-mix" },
      playlists: [{ id: "p1" }, { id: "p2" }],
      albums: [{ id: "a1" }],
      artists: [{ id: "ar1" }],
    });
    expect(model.filters).toEqual(["All", "Music", "Mixes", "Charts"]);
    expect(model.tiles.map((item) => item.id)).toEqual(["p1", "p2", "a1"]);
  });
});
