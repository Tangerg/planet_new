import { describe, expect, test } from "vitest";

import { collectionMeta, collectionSub, sortTracks } from "./derive";
import type { VibeCollection, VibeTrack } from "./adapt";

const collection = (overrides: Partial<VibeCollection> = {}): VibeCollection => ({
  id: "c",
  name: "Collection",
  kind: "Playlist",
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
    expect(collectionMeta(collection({ trackCount: 42 }), "playlists")).toBe("42 tracks");
    expect(collectionMeta(collection({ tracks: [track("1", "One", 1)] }), "playlists")).toBe(
      "1 tracks",
    );
  });

  test("formats album metadata without leaking undefined year", () => {
    expect(collectionMeta(collection({ artist: "Artist", trackCount: 10 }), "albums")).toBe(
      "10 tracks",
    );
    expect(collectionMeta(collection({ year: 1999, trackCount: 10 }), "albums")).toBe(
      "1999 · 10 tracks",
    );
    expect(collectionSub(collection({ artist: "Artist" }), "albums")).toBe("Artist");
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
