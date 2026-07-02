import { describe, expect, test, vi } from "vitest";
import { MediaService } from "./MediaService";
import type { MusicProvider } from "@domain";
import { SearchResult } from "@domain/model/search";
import type { MusicVideo } from "@domain/model/music-video";

function makeProvider(overrides: Partial<MusicProvider> = {}): MusicProvider {
  const capabilities = overrides.capabilities ?? new Set();
  const provider = {
    name: "fake",
    capabilities,
    supports(cap) {
      return this.capabilities.has(cap);
    },
    playlistDetail: async () => ({ id: "", name: "", images: [], tracks: [] }),
    lyric: async () => [],
    albumDetail: async () => ({ id: "", name: "", images: [], artists: [] }),
    artistDetail: async () => ({ id: "", name: "", images: [] }),
    trackDetail: async () => undefined,
    trackDetails: async () => [],
    musicVideoDetail: async () => undefined,
    artistMusicVideos: async () => [],
    musicVideoComments: async () => [],
    playUrls: async () => [],
    personalized: async () => ({ playlists: [] }),
    search: async () => SearchResult.empty(),
    toplists: async () => [],
    toplistDetail: async () => ({ id: "", name: "", images: [], tracks: [] }),
    comments: async () => [],
    ...overrides,
  } satisfies MusicProvider;
  return provider;
}

describe("MediaService.discoverArtistMusicVideos", () => {
  test("returns empty when the active provider has no artist MV capability", async () => {
    let calls = 0;
    const service = new MediaService(() =>
      makeProvider({
        artistMusicVideos: async () => {
          calls += 1;
          return [];
        },
      }),
    );

    await expect(service.discoverArtistMusicVideos([{ id: "artist-1" }])).resolves.toEqual([]);
    expect(calls).toBe(0);
  });

  test("queries bounded artist seeds, tolerates failures, and de-duplicates videos", async () => {
    const calls: string[] = [];
    const videosByArtist: Record<string, Partial<MusicVideo>[]> = {
      a: [{ id: "mv-1", name: "One" }],
      b: [
        { id: "mv-1", name: "One duplicate" },
        { id: "mv-2", name: "Two" },
      ],
      c: [{ id: "", name: "Nameless id" }],
      d: [{ id: "mv-3", name: "Three" }],
    };
    const service = new MediaService(() =>
      makeProvider({
        capabilities: new Set(["artistMusicVideos"]),
        artistMusicVideos: async (artistId: string) => {
          calls.push(artistId);
          if (artistId === "fail") throw new Error("provider failed");
          return videosByArtist[artistId] ?? [];
        },
      }),
    );

    const result = await service.discoverArtistMusicVideos(
      [{ id: "a" }, { id: "b" }, { id: "fail" }, { id: "c" }, { id: "d" }, { id: "e" }],
      { artistLimit: 5, videoLimit: 2 },
    );

    expect(calls).toEqual(["a", "b", "fail", "c", "d"]);
    expect(result).toEqual([
      { id: "mv-1", name: "One" },
      { id: "mv-2", name: "Two" },
    ]);
  });
});

describe("MediaService optional provider reads", () => {
  test("exposes the active provider's MV playback policy from capabilities", () => {
    const service = new MediaService(() =>
      makeProvider({ capabilities: new Set(["musicVideoDetail"]) }),
    );

    expect(service.musicVideoPlaybackPolicy()).toEqual({ canResolvePlayback: true });

    const unsupported = new MediaService(() => makeProvider({}));
    expect(unsupported.musicVideoPlaybackPolicy()).toEqual({ canResolvePlayback: false });
  });

  test("does not call providers for unsupported optional capabilities", async () => {
    let calls = 0;
    const service = new MediaService(() =>
      makeProvider({
        search: async () => {
          calls += 1;
          return {
            tracks: [{ id: "track", name: "Track", durationMs: 1, artists: [] }],
            artists: [],
            albums: [],
            playlists: [],
          };
        },
        toplists: async () => {
          calls += 1;
          return [{ id: "chart", title: "Chart", image: "" }];
        },
        comments: async () => {
          calls += 1;
          return [];
        },
      }),
    );

    await expect(service.search("song")).resolves.toEqual(SearchResult.empty());
    await expect(service.toplists()).resolves.toEqual([]);
    await expect(service.comments("track")).resolves.toEqual([]);
    await expect(service.musicVideoDetail("mv")).resolves.toBeUndefined();
    await expect(service.toplistDetail("chart")).resolves.toEqual({
      id: "chart",
      name: "",
      images: [],
      tracks: [],
      totalTracks: 0,
    });
    expect(calls).toBe(0);
  });

  test("normalizes optional provider failures to empty domain values", async () => {
    const service = new MediaService(() =>
      makeProvider({
        capabilities: new Set([
          "search",
          "toplist",
          "comments",
          "trackDetail",
          "musicVideoDetail",
          "artistMusicVideos",
          "musicVideoComments",
        ]),
        search: async () => {
          throw new Error("search failed");
        },
        toplists: async () => {
          throw new Error("toplists failed");
        },
        comments: async () => {
          throw new Error("comments failed");
        },
        trackDetails: async () => {
          throw new Error("track detail failed");
        },
        musicVideoDetail: async () => {
          throw new Error("mv detail failed");
        },
        artistMusicVideos: async () => {
          throw new Error("artist mv failed");
        },
        musicVideoComments: async () => {
          throw new Error("mv comments failed");
        },
      }),
    );

    await expect(service.search("song")).resolves.toEqual(SearchResult.empty());
    await expect(service.toplists()).resolves.toEqual([]);
    await expect(service.comments("track")).resolves.toEqual([]);
    await expect(service.trackDetail("track")).resolves.toBeUndefined();
    await expect(service.trackDetails(["track"])).resolves.toEqual([]);
    await expect(service.musicVideoDetail("mv")).resolves.toBeUndefined();
    await expect(service.artistMusicVideos("artist")).resolves.toEqual([]);
    await expect(service.musicVideoComments("mv")).resolves.toEqual([]);
  });

  test("surfaces a supported read that faulted (observable), but stays silent when unsupported", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const failing = new MediaService(() =>
      makeProvider({
        capabilities: new Set(["search"]),
        search: async () => {
          throw new Error("boom");
        },
      }),
    );
    await expect(failing.search("song")).resolves.toEqual(SearchResult.empty());
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("fake.search read failed");

    warn.mockClear();
    const unsupported = new MediaService(() => makeProvider({}));
    await expect(unsupported.search("song")).resolves.toEqual(SearchResult.empty());
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  test("skips empty searches and empty track batches before provider calls", async () => {
    let calls = 0;
    const service = new MediaService(() =>
      makeProvider({
        capabilities: new Set(["search", "trackDetail"]),
        search: async () => {
          calls += 1;
          return SearchResult.empty();
        },
        trackDetails: async () => {
          calls += 1;
          return [];
        },
      }),
    );

    await expect(service.search("   ")).resolves.toEqual(SearchResult.empty());
    await expect(service.trackDetails([])).resolves.toEqual([]);
    expect(calls).toBe(0);
  });
});
