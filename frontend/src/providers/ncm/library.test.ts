import { describe, expect, test } from "vitest";

import { fakeKy } from "./fake-ky";
import {
  fetchNcmDailyRecommendations,
  fetchNcmLikedTrackIds,
  fetchNcmPlayRecord,
  fetchNcmUserPlaylists,
  setNcmLiked,
} from "./library";

describe("fetchNcmLikedTrackIds", () => {
  test("stringifies the liked id list", async () => {
    const { http } = fakeKy({ likelist: { ids: [1, 2, 3] } });
    expect(await fetchNcmLikedTrackIds(http, "u1")).toEqual(["1", "2", "3"]);
  });

  test("returns [] when the request fails", async () => {
    const { http } = fakeKy({
      likelist: () => {
        throw new Error("down");
      },
    });
    expect(await fetchNcmLikedTrackIds(http, "u1")).toEqual([]);
  });
});

describe("setNcmLiked", () => {
  test("sends the like flag for the track", async () => {
    const { http, calls } = fakeKy({ like: {} });
    await setNcmLiked(http, "t7", true);
    const call = calls.find((c) => c.path === "like");
    expect(call?.searchParams.id).toBe("t7");
    expect(call?.searchParams.like).toBe(true);
  });
});

describe("fetchNcmUserPlaylists", () => {
  test("maps playlist stubs with empty track lists", async () => {
    const { http } = fakeKy({
      "user/playlist": {
        playlist: [{ id: 1, name: "P", trackCount: 5, picUrl: "http://p" }],
      },
    });
    const playlists = await fetchNcmUserPlaylists(http, "u1");
    expect(playlists).toHaveLength(1);
    expect(playlists[0]).toMatchObject({ id: "1", name: "P", totalTracks: 5, tracks: [] });
  });
});

describe("fetchNcmPlayRecord", () => {
  test("reads weekData with type=1 and skips rows lacking a song", async () => {
    const { http, calls } = fakeKy({
      "user/record": (sp: Record<string, unknown>) =>
        sp.type === 1
          ? { weekData: [{ song: { id: 10, name: "a" } }, { playCount: 3 }] }
          : { allData: [] },
    });
    const record = await fetchNcmPlayRecord(http, "u1", "week");
    expect(record).toHaveLength(1);
    expect(record[0]).toMatchObject({ id: "10", index: 1 });
    expect(calls.find((c) => c.path === "user/record")?.searchParams.type).toBe(1);
  });

  test("reads allData with type=0", async () => {
    const { http, calls } = fakeKy({
      "user/record": (sp: Record<string, unknown>) =>
        sp.type === 0 ? { allData: [{ song: { id: 20, name: "b" } }] } : {},
    });
    const record = await fetchNcmPlayRecord(http, "u1", "all");
    expect(record.map((t) => t.id)).toEqual(["20"]);
    expect(calls.find((c) => c.path === "user/record")?.searchParams.type).toBe(0);
  });
});

describe("fetchNcmDailyRecommendations", () => {
  test("maps daily songs with a 1-based index", async () => {
    const { http } = fakeKy({
      "recommend/songs": {
        data: {
          dailySongs: [
            { id: 1, name: "x" },
            { id: 2, name: "y" },
          ],
        },
      },
    });
    const daily = await fetchNcmDailyRecommendations(http);
    expect(daily.map((t) => t.id)).toEqual(["1", "2"]);
    expect(daily.map((t) => t.index)).toEqual([1, 2]);
  });

  test("returns [] when the request fails", async () => {
    const { http } = fakeKy({
      "recommend/songs": () => {
        throw new Error("down");
      },
    });
    expect(await fetchNcmDailyRecommendations(http)).toEqual([]);
  });
});
