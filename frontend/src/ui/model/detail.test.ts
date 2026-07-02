import { describe, expect, test } from "vitest";

import {
  detailKindOf,
  loadArtistTarget,
  loadDetailTarget,
  loadMusicVideoDetail,
  mergeDetailTarget,
  mergeMusicVideoDetail,
  normalizeDetailTarget,
  shouldFetchArtistTarget,
  shouldFetchDetailTarget,
  shouldFetchMusicVideoDetail,
} from "./detail";
import type { Artist } from "@domain/model/artist";
import type { Album } from "@domain/model/album";
import type { Playlist } from "@domain/model/playlist";
import type { MusicVideo } from "@domain/model/music-video";
import type { DetailTarget, VibeCollection, VibeMusicVideo, VibeTrack } from "./adapt";

const track = (id: string): VibeTrack => ({
  id,
  title: "Track",
  name: "Track",
  artist: "",
  coverSeed: 1,
  durSec: 1,
  duration: "00:01",
});

const summary = (overrides: Partial<DetailTarget> = {}): DetailTarget => ({
  id: "playlist-1",
  name: "Summary",
  coverSeed: 10,
  image: "summary.jpg",
  kind: "Playlist",
  tracks: [],
  ...overrides,
});

describe("detail read-model helpers", () => {
  test("normalizes loose open targets into concrete detail targets", () => {
    expect(normalizeDetailTarget({ id: "1", name: "Any", coverSeed: 1 }).tracks).toEqual([]);
    expect(detailKindOf({ kind: "Album" })).toBe("Album");
    expect(detailKindOf({ kind: "Chart" })).toBe("Chart");
    expect(detailKindOf({ kind: "Whatever" })).toBe("Playlist");
  });

  test("decides whether a collection summary needs provider detail", () => {
    expect(shouldFetchDetailTarget(summary())).toBe(true);
    expect(shouldFetchDetailTarget(summary({ id: "" }))).toBe(false);
    expect(shouldFetchDetailTarget(summary({ fetchDetail: false }))).toBe(false);
    expect(shouldFetchDetailTarget(summary({ tracks: [track("t")] }))).toBe(false);
  });

  test("loads collection detail by domain kind", async () => {
    const calls: string[] = [];
    const reader = {
      albumDetail: async (id: string): Promise<Album> => {
        calls.push(`album:${id}`);
        return { id, name: "Album", images: [], artists: [], tracks: [] };
      },
      playlistDetail: async (id: string): Promise<Playlist> => {
        calls.push(`playlist:${id}`);
        return { id, name: "Playlist", images: [], tracks: [] };
      },
      toplistDetail: async (id: string): Promise<Playlist> => {
        calls.push(`chart:${id}`);
        return { id, name: "Chart", images: [], tracks: [] };
      },
    };

    await loadDetailTarget(reader, summary({ id: "a", kind: "Album" }));
    await loadDetailTarget(reader, summary({ id: "c", kind: "Chart" }));
    await loadDetailTarget(reader, summary({ id: "p", kind: "Playlist" }));
    expect(calls).toEqual(["album:a", "chart:c", "playlist:p"]);
  });

  test("merges provider detail with stable summary identity fallbacks", () => {
    const full: VibeCollection = {
      id: "playlist-1",
      name: "",
      kind: "Playlist",
      coverSeed: 22,
      image: "",
      tracks: [track("t")],
    };

    expect(mergeDetailTarget(summary(), full)).toMatchObject({
      name: "Summary",
      image: "summary.jpg",
      coverSeed: 10,
      tracks: full.tracks,
    });
  });

  test("loads artist detail with top tracks projected into the play context", async () => {
    const reader = {
      artistDetail: async (id: string): Promise<Artist> => ({
        id,
        name: "Artist",
        images: [],
        topTracks: [{ id: "track", name: "Track", durationMs: 1000, artists: [] }],
      }),
    };

    expect(shouldFetchArtistTarget({ id: "artist", name: "Artist" })).toBe(true);
    const loaded = await loadArtistTarget(reader, { id: "artist", name: "Artist" });
    expect(loaded.tracks?.[0]?.id).toBe("track");
  });

  test("merges music-video detail only into the matching current screen", () => {
    const current: VibeMusicVideo = {
      id: "mv",
      title: "Summary",
      name: "Summary",
      artist: "",
      coverSeed: 1,
      duration: "00:00",
      durSec: 0,
    };
    const detail: VibeMusicVideo = { ...current, title: "Full", name: "Full", playUrl: "url" };

    expect(shouldFetchMusicVideoDetail(current, () => true)).toBe(true);
    expect(shouldFetchMusicVideoDetail(current, () => false)).toBe(false);
    expect(mergeMusicVideoDetail(current, "mv", detail)).toMatchObject({
      title: "Full",
      playUrl: "url",
    });
    expect(mergeMusicVideoDetail(current, "other", detail)).toBe(current);
  });

  test("loads optional music-video detail", async () => {
    const reader = {
      musicVideoDetail: async (id: string): Promise<MusicVideo> => ({
        id,
        name: "MV",
        images: [],
        artists: [],
        playUrl: "url",
      }),
    };

    await expect(
      loadMusicVideoDetail(reader, {
        id: "mv",
        title: "MV",
        name: "MV",
        artist: "",
        coverSeed: 1,
        duration: "00:00",
        durSec: 0,
      }),
    ).resolves.toMatchObject({ id: "mv", playUrl: "url" });
  });
});
