import { describe, expect, test, vi } from "vitest";
import { MediaService } from "./MediaService";
import { ProviderId, type CatalogPorts, type CatalogSource } from "@domain";
import { SearchResult } from "@domain/model/search";
import type { MusicVideoSummary } from "@domain/model/music-video";
import type { TrackSnapshot } from "@domain/model/track";

const FAKE_PROVIDER_ID = ProviderId.of("fake");

const EMPTY_PORTS: CatalogPorts = {
  home: null,
  playlists: null,
  albums: null,
  artists: null,
  tracks: null,
  search: null,
  charts: null,
  musicVideos: null,
  artistMusicVideos: null,
};

function makeSource(ports: Partial<CatalogPorts> = {}): CatalogSource {
  return {
    providerId: FAKE_PROVIDER_ID,
    name: "fake",
    catalog: { ...EMPTY_PORTS, ...ports },
  };
}

describe("MediaService.discoverArtistMusicVideos", () => {
  test("returns unsupported when the active source registered no artist-MV port", async () => {
    const service = new MediaService(() => makeSource());
    await expect(service.discoverArtistMusicVideos([{ id: "artist-1" }])).resolves.toEqual({
      status: "unsupported",
    });
  });

  test("queries bounded artist seeds, tolerates failures, and de-duplicates videos", async () => {
    const calls: string[] = [];
    const video = (id: string, name: string): MusicVideoSummary => ({
      providerId: FAKE_PROVIDER_ID,
      id,
      name,
      images: [],
      artists: [],
    });
    const videosByArtist: Record<string, MusicVideoSummary[]> = {
      a: [video("mv-1", "One")],
      b: [video("mv-1", "One duplicate"), video("mv-2", "Two")],
      c: [video("", "Nameless id")],
      d: [video("mv-3", "Three")],
    };
    const service = new MediaService(() =>
      makeSource({
        artistMusicVideos: {
          artistMusicVideos: async (artistId) => {
            calls.push(artistId);
            if (artistId === "fail") throw new Error("provider failed");
            return videosByArtist[artistId] ?? [];
          },
        },
      }),
    );

    const result = await service.discoverArtistMusicVideos(
      [{ id: "a" }, { id: "b" }, { id: "fail" }, { id: "c" }, { id: "d" }, { id: "e" }],
      { artistLimit: 5, videoLimit: 2 },
    );

    expect(calls).toEqual(["a", "b", "fail", "c", "d"]);
    expect(result).toMatchObject({
      status: "partial",
      data: [
        { id: "mv-1", name: "One" },
        { id: "mv-2", name: "Two" },
      ],
    });
    expect(result.status === "partial" ? result.errors : []).toHaveLength(1);
  });
});

describe("MediaService optional catalog ports", () => {
  test("derives MV playback policy from the registered port", () => {
    const supported = new MediaService(() =>
      makeSource({ musicVideos: { musicVideoDetail: async () => undefined } }),
    );
    expect(supported.musicVideoPlaybackPolicy()).toEqual({ canResolvePlayback: true });
    expect(new MediaService(() => makeSource()).musicVideoPlaybackPolicy()).toEqual({
      canResolvePlayback: false,
    });
  });

  test("distinguishes absent optional ports from successful empty data", async () => {
    const service = new MediaService(() => makeSource());

    await expect(service.search("song")).resolves.toEqual({ status: "unsupported" });
    await expect(service.toplists()).resolves.toEqual({ status: "unsupported" });
    await expect(service.musicVideoDetail("mv")).resolves.toEqual({ status: "unsupported" });
    await expect(service.toplistDetail("chart")).resolves.toEqual({ status: "unsupported" });
  });

  test("returns failed for registered port faults instead of empty domain values", async () => {
    const fail = async (): Promise<never> => {
      throw new Error("failed");
    };
    const service = new MediaService(() =>
      makeSource({
        search: { search: fail },
        charts: { toplists: fail, toplistDetail: fail },
        tracks: { trackDetail: fail, trackDetails: fail },
        musicVideos: { musicVideoDetail: fail },
        artistMusicVideos: { artistMusicVideos: fail },
      }),
    );

    for (const result of await Promise.all([
      service.search("song"),
      service.toplists(),
      service.trackDetail("track"),
      service.trackDetails(["track"]),
      service.musicVideoDetail("mv"),
      service.artistMusicVideos("artist"),
    ])) {
      expect(result.status).toBe("failed");
    }
  });

  test("preserves failure diagnostics and keeps them distinct from unsupported", async () => {
    const cause = new Error("boom");
    const failing = new MediaService(() =>
      makeSource({
        search: {
          search: async () => {
            throw cause;
          },
        },
      }),
    );

    const failed = await failing.search("song");
    expect(failed).toMatchObject({
      status: "failed",
      error: { source: "fake", operation: "search", cause },
    });
    await expect(new MediaService(() => makeSource()).search("song")).resolves.toEqual({
      status: "unsupported",
    });
  });

  test("maps an addressable missing entity to notFound", async () => {
    const service = new MediaService(() =>
      makeSource({
        tracks: { trackDetail: async () => undefined, trackDetails: async () => [] },
        musicVideos: { musicVideoDetail: async () => undefined },
      }),
    );

    await expect(service.trackDetail("missing")).resolves.toEqual({ status: "notFound" });
    await expect(service.musicVideoDetail("missing")).resolves.toEqual({ status: "notFound" });
  });

  test("skips empty searches and track batches before port calls", async () => {
    const search = vi.fn<(query: string) => Promise<SearchResult>>(async () =>
      SearchResult.empty(),
    );
    const trackDetails = vi.fn<(ids: string[]) => Promise<TrackSnapshot[]>>(async () => []);
    const service = new MediaService(() =>
      makeSource({
        search: { search },
        tracks: { trackDetail: async () => undefined, trackDetails },
      }),
    );

    await expect(service.search("   ")).resolves.toEqual({
      status: "success",
      data: SearchResult.empty(),
    });
    await expect(service.trackDetails([])).resolves.toEqual({ status: "success", data: [] });
    expect(search).not.toHaveBeenCalled();
    expect(trackDetails).not.toHaveBeenCalled();
  });
});
