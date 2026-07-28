import { describe, expect, test } from "vitest";

import { collectionMeta, collectionSub, collectionTrackCount, sortTracks } from "./derive";
import type { VibeCollection, VibeTrack } from "./vibe";

const collection = (overrides: Partial<VibeCollection> = {}): VibeCollection => ({
  id: "c",
  name: "Collection",
  kind: "playlist",
  coverSeed: 1,
  tracks: [],
  ...overrides,
});

const track = (id: string, title: string, durSec: number): VibeTrack => ({
  id,
  title,
  name: title,
  artist: "",
  coverSeed: 1,
  durSec,
  duration: "00:00",
});

describe("collection labels", () => {
  test("uses provider trackCount before loaded track length", () => {
    expect(collectionMeta(collection({ trackCount: 42 }), "playlists")).toEqual([
      { key: "counts.tracks", values: { count: 42 } },
    ]);
    expect(collectionMeta(collection({ tracks: [track("1", "One", 1)] }), "playlists")).toEqual([
      { key: "counts.tracks", values: { count: 1 } },
    ]);
    expect(
      collectionTrackCount(collection({ trackCount: 3, tracks: [track("1", "One", 1)] })),
    ).toBe(3);
  });

  test("names album metadata parts, leaving an unknown year empty", () => {
    expect(collectionMeta(collection({ artist: "Artist", trackCount: 10 }), "albums")).toEqual([
      { text: "" },
      { key: "counts.tracks", values: { count: 10 } },
    ]);
    expect(collectionMeta(collection({ year: 1999, trackCount: 10 }), "albums")).toEqual([
      { text: "1999" },
      { key: "counts.tracks", values: { count: 10 } },
    ]);
    expect(collectionMeta(collection(), "artists")).toEqual([]);
    expect(collectionSub(collection({ artist: "Artist" }), "albums")).toEqual({ text: "Artist" });
    expect(collectionSub(collection(), "artists")).toEqual({ text: "" });
    expect(collectionSub(collection(), "playlists")).toEqual({ key: "common.playlist" });
  });
});

describe("track sorting", () => {
  test("keeps original index while sorting by title or duration", () => {
    const tracks = [track("b", "Beta", 30), track("a", "Alpha", 90)];

    expect(sortTracks(tracks, "title").map(({ t, i }) => [t.id, i])).toEqual([
      ["a", 1],
      ["b", 0],
    ]);
    expect(sortTracks(tracks, "duration").map(({ t, i }) => [t.id, i])).toEqual([
      ["b", 0],
      ["a", 1],
    ]);
  });
});
