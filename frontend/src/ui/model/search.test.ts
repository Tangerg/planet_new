import { describe, expect, it } from "vitest";

import type { SearchResults, VibeArtist, VibeTrack } from "./vibe";
import {
  EMPTY_SEARCH_RESULTS,
  SEARCH_SONG_PREVIEW_LIMIT,
  hasSearchResults,
  normalizeSearchTerm,
  searchRequestPlan,
  searchScreenModel,
  searchStatus,
} from "./search";

const track = (id: string): VibeTrack => ({
  id,
  title: id,
  name: id,
  artist: "Artist",
  coverSeed: 1,
  durSec: 10,
  duration: "0:10",
});

const artist = (id: string): VibeArtist => ({
  id,
  name: id,
  coverSeed: 2,
});

const results = (overrides: Partial<SearchResults> = {}): SearchResults => ({
  ...EMPTY_SEARCH_RESULTS,
  ...overrides,
});

describe("search screen model", () => {
  it("normalizes query text without changing the controlled input value", () => {
    expect(normalizeSearchTerm("  周杰伦  ")).toBe("周杰伦");
    expect(searchScreenModel("  Jay  ").normalizedTerm).toBe("jay");
  });

  it("plans provider requests from the normalized term", () => {
    expect(searchRequestPlan("   ")).toEqual({ term: "", shouldRequest: false });
    expect(searchRequestPlan("  周杰伦  ")).toEqual({ term: "周杰伦", shouldRequest: true });
  });

  it("classifies idle, loading, empty, and ready states", () => {
    expect(searchStatus("", EMPTY_SEARCH_RESULTS, false)).toBe("idle");
    expect(searchStatus("周杰伦", EMPTY_SEARCH_RESULTS, true)).toBe("loading");
    expect(searchStatus("周杰伦", EMPTY_SEARCH_RESULTS, false)).toBe("empty");
    expect(searchStatus("周杰伦", results({ tracks: [track("t1")] }), false)).toBe("ready");
  });

  it("detects any populated search bucket", () => {
    expect(hasSearchResults(EMPTY_SEARCH_RESULTS)).toBe(false);
    expect(hasSearchResults(results({ artists: [artist("a1")] }))).toBe(true);
  });

  it("projects top artist and empty messages for the screen", () => {
    const loading = searchScreenModel("周杰伦", EMPTY_SEARCH_RESULTS, true);
    const ready = searchScreenModel("周杰伦", results({ artists: [artist("a1")] }));

    expect(loading).toMatchObject({
      status: "loading",
      emptyMessage: "Searching “周杰伦”…",
      topArtist: null,
    });
    expect(ready).toMatchObject({
      status: "ready",
      emptyMessage: "",
      topArtist: { id: "a1", name: "a1" },
    });
  });

  it("limits the song preview without mutating raw search results", () => {
    const rawTracks = Array.from({ length: 8 }, (_, index) => track(`t${index}`));
    const model = searchScreenModel("t", results({ tracks: rawTracks }));

    expect(model.tracks).toHaveLength(8);
    expect(model.topTracks.map((item) => item.id)).toEqual(
      rawTracks.slice(0, SEARCH_SONG_PREVIEW_LIMIT).map((item) => item.id),
    );
  });
});
