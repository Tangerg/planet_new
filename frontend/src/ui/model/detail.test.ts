import { describe, expect, test } from "vitest";

import {
  detailKindOf,
  detailHeroTitleSize,
  detailSelectedTracks,
  detailSelectionOrderIds,
  firstDetailSelectedTrack,
  loadArtistTarget,
  loadDetailTarget,
  loadMusicVideoDetail,
  mergeDetailTarget,
  mergeMusicVideoDetail,
  nextDetailSelection,
  normalizeDetailTarget,
  shouldFetchArtistTarget,
  shouldFetchDetailTarget,
  shouldFetchMusicVideoDetail,
  weightedDisplayLength,
} from "./detail";
import type {
  AlbumDetailSnapshot,
  ArtistDetailSnapshot,
  MusicVideoDetailSnapshot,
  PlaylistDetailSnapshot,
} from "@contexts/catalog";
import type { DetailTarget, VibeCollection, VibeMusicVideo, VibeTrack } from "./vibe";
import { ProviderId } from "@domain/model/provider-id";

const TEST_PROVIDER_ID = ProviderId.of("test");

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
  kind: "playlist",
  tracks: [],
  ...overrides,
});

describe("detail read-model helpers", () => {
  test("sizes detail hero titles by weighted display length", () => {
    expect(weightedDisplayLength("Daily Mix")).toBe(9);
    expect(weightedDisplayLength("今天从《月牙湾》听起私人雷达")).toBe(28);
    expect(detailHeroTitleSize("Short")).toBe(64);
    expect(detailHeroTitleSize("今天从《月牙湾》听起私人雷达")).toBe(52);
    expect(
      detailHeroTitleSize("这是一段非常非常长的中文歌单标题用于测试字号收敛并且仍然优雅显示"),
    ).toBe(34);
  });

  test("normalizes loose open targets into concrete detail targets", () => {
    expect(normalizeDetailTarget({ id: "1", name: "Any", coverSeed: 1 }).tracks).toEqual([]);
    expect(detailKindOf({ kind: "album" })).toBe("album");
    expect(detailKindOf({ kind: "chart" })).toBe("chart");
    // `artist` has its own screen, so Detail treats it like a plain collection.
    expect(detailKindOf({ kind: "artist" })).toBe("playlist");
    expect(detailKindOf({})).toBe("playlist");
  });

  test("decides whether a collection summary needs provider detail", () => {
    expect(shouldFetchDetailTarget(summary())).toBe(true);
    expect(shouldFetchDetailTarget(summary({ id: "" }))).toBe(false);
    expect(shouldFetchDetailTarget(summary({ fetchDetail: false }))).toBe(false);
    expect(shouldFetchDetailTarget(summary({ tracks: [track("t")] }))).toBe(false);
  });

  test("updates detail selection by toggle or sorted shift range", () => {
    const sorted = [track("a"), track("b"), track("c"), track("d")].map((t, i) => ({ t, i }));
    const orderedIds = detailSelectionOrderIds(sorted);

    expect([
      ...nextDetailSelection({
        anchorId: null,
        extendRange: false,
        orderedIds,
        selected: new Set(),
        trackId: "b",
      }),
    ]).toEqual(["b"]);
    expect([
      ...nextDetailSelection({
        anchorId: "b",
        extendRange: true,
        orderedIds,
        selected: new Set(["b"]),
        trackId: "d",
      }),
    ]).toEqual(["b", "c", "d"]);
    expect([
      ...nextDetailSelection({
        anchorId: "missing",
        extendRange: true,
        orderedIds,
        selected: new Set(["b"]),
        trackId: "b",
      }),
    ]).toEqual([]);
  });

  test("projects selected detail tracks for batch actions", () => {
    const tracks = [track("a"), track("b"), track("c")];
    const selected = new Set(["b", "c"]);

    expect(detailSelectedTracks(tracks, selected).map((t) => t.id)).toEqual(["b", "c"]);
    expect(firstDetailSelectedTrack(tracks, selected)?.id).toBe("b");
    expect(firstDetailSelectedTrack(tracks, new Set(["missing"]))).toBeUndefined();
  });

  test("loads collection detail by domain kind", async () => {
    const calls: string[] = [];
    const reader = {
      albumDetail: async (id: string): Promise<AlbumDetailSnapshot> => {
        calls.push(`album:${id}`);
        return {
          providerId: TEST_PROVIDER_ID,
          id,
          name: "Album",
          images: [],
          artists: [],
          tracks: [],
        };
      },
      playlistDetail: async (id: string): Promise<PlaylistDetailSnapshot> => {
        calls.push(`playlist:${id}`);
        return { providerId: TEST_PROVIDER_ID, id, name: "Playlist", images: [], tracks: [] };
      },
      toplistDetail: async (id: string): Promise<PlaylistDetailSnapshot> => {
        calls.push(`chart:${id}`);
        return { providerId: TEST_PROVIDER_ID, id, name: "Chart", images: [], tracks: [] };
      },
    };

    await loadDetailTarget(reader, summary({ id: "a", kind: "album" }));
    await loadDetailTarget(reader, summary({ id: "c", kind: "chart" }));
    await loadDetailTarget(reader, summary({ id: "p", kind: "playlist" }));
    expect(calls).toEqual(["album:a", "chart:c", "playlist:p"]);
  });

  test("reports nothing to show when the source has no such collection", async () => {
    const missing = {
      albumDetail: async () => null,
      playlistDetail: async () => null,
      toplistDetail: async () => null,
    };

    expect(await loadDetailTarget(missing, summary({ id: "a", kind: "album" }))).toBeNull();
    expect(await loadDetailTarget(missing, summary({ id: "c", kind: "chart" }))).toBeNull();
    expect(await loadDetailTarget(missing, summary({ id: "p", kind: "playlist" }))).toBeNull();
  });

  test("merges provider detail with stable summary identity fallbacks", () => {
    const full: VibeCollection = {
      id: "playlist-1",
      name: "",
      kind: "playlist",
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
      artistDetail: async (id: string): Promise<ArtistDetailSnapshot> => ({
        providerId: TEST_PROVIDER_ID,
        id,
        name: "Artist",
        images: [],
        topTracks: [
          {
            providerId: TEST_PROVIDER_ID,
            id: "track",
            name: "Track",
            durationMs: 1000,
            artists: [],
          },
        ],
        albums: [],
        similar: [],
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

    expect(shouldFetchMusicVideoDetail(current, true)).toBe(true);
    expect(shouldFetchMusicVideoDetail(current, false)).toBe(false);
    expect(mergeMusicVideoDetail(current, "mv", detail)).toMatchObject({
      title: "Full",
      playUrl: "url",
    });
    expect(mergeMusicVideoDetail(current, "other", detail)).toBe(current);
  });

  test("loads optional music-video detail", async () => {
    const reader = {
      musicVideoDetail: async (id: string): Promise<MusicVideoDetailSnapshot> => ({
        providerId: TEST_PROVIDER_ID,
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
