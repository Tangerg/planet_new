import { describe, expect, it } from "vitest";

import type { ScreenData, VibeCollection, VibeTrack } from "./vibe";
import {
  dailyMixCollection,
  forYouCollectionRoute,
  forYouScreenModel,
  forYouTiles,
  timeOfDayGreetingKey,
} from "./for-you";

const DAILY_MIX_TEXT = {
  name: "Daily Mix",
  owner: "For You",
  description: "Picked for you",
};

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

const NOW = new Date("2026-01-01T21:00:00");

const screenData = (overrides: Partial<ScreenData> = {}): ScreenData => ({
  playlists: [collection("p1"), collection("p2")],
  albums: [collection("a1", "Album", { artist: "Artist" })],
  artists: [{ id: "ar1", name: "Artist", coverSeed: 3 }],
  allTracks: [],
  ...overrides,
});

describe("for you screen model", () => {
  it("names the greeting message for the current hour", () => {
    expect(timeOfDayGreetingKey(new Date("2026-01-01T03:00:00"))).toBe("forYou.lateNight");
    expect(timeOfDayGreetingKey(new Date("2026-01-01T08:00:00"))).toBe("forYou.morning");
    expect(timeOfDayGreetingKey(new Date("2026-01-01T14:00:00"))).toBe("forYou.afternoon");
    expect(timeOfDayGreetingKey(new Date("2026-01-01T21:00:00"))).toBe("forYou.evening");
  });

  it("builds a synthetic daily mix without requiring provider detail fetch", () => {
    expect(dailyMixCollection([track("t1")], DAILY_MIX_TEXT)).toMatchObject({
      id: "daily-mix",
      name: "Daily Mix",
      kind: "Playlist",
      owner: "For You",
      coverSeed: 11,
      image: "t1.jpg",
      fetchDetail: false,
      tracks: [{ id: "t1" }],
    });
    expect(dailyMixCollection([], DAILY_MIX_TEXT)).toBeUndefined();
  });

  it("uses daily mix as featured, then falls back to curated playlists", () => {
    const featured = (data: ScreenData, daily: VibeTrack[]) =>
      forYouScreenModel(data, daily, DAILY_MIX_TEXT, NOW).featured;

    expect(featured(screenData(), [track("t1")])?.id).toBe("daily-mix");
    expect(featured(screenData(), [])?.id).toBe("p2");
    expect(featured(screenData({ playlists: [collection("only")] }), [])?.id).toBe("only");
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
    const model = forYouScreenModel(
      screenData(),
      [track("t1")],
      DAILY_MIX_TEXT,
      new Date("2026-01-01T21:00:00"),
    );

    expect(model).toMatchObject({
      greetingKey: "forYou.evening",
      featured: { id: "daily-mix" },
      playlists: [{ id: "p1" }, { id: "p2" }],
      albums: [{ id: "a1" }],
      artists: [{ id: "ar1" }],
    });
    expect(model.filters.map((filter) => filter.value)).toEqual([
      "all",
      "music",
      "mixes",
      "charts",
    ]);
    expect(model.tiles.map((item) => item.id)).toEqual(["p1", "p2", "a1"]);
  });

  it("keeps filters and an empty model when no recommendations exist", () => {
    const model = forYouScreenModel(
      screenData({ albums: [], artists: [], playlists: [] }),
      [],
      DAILY_MIX_TEXT,
      new Date("2026-01-01T08:00:00"),
    );

    expect(model).toMatchObject({
      greetingKey: "forYou.morning",
      albums: [],
      artists: [],
      dailyMix: undefined,
      featured: undefined,
      playlists: [],
      tiles: [],
    });
    expect(model.filters.map((filter) => filter.labelKey)).toEqual([
      "common.all",
      "common.music",
      "common.mixes",
      "common.charts",
    ]);
  });
});
