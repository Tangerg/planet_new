import { describe, expect, test } from "vitest";

import { fakeKy, type FakeCall } from "./fake-ky";
import {
  fetchNcmLyrics,
  fetchNcmPlayUrls,
  fetchNcmPlaylistTracks,
  fetchNcmTrackDetails,
} from "./tracks";

const songs = (count: number, base = 0) =>
  Array.from({ length: count }, (_, i) => ({ id: base + i, name: `s${base + i}` }));

const offsetsOf = (calls: FakeCall[], path: string) =>
  calls.filter((c) => c.path === path).map((c) => Number(c.searchParams.offset));

describe("fetchNcmPlaylistTracks", () => {
  test("stops on the first short page", async () => {
    const { http, calls } = fakeKy({ "playlist/track/all": { songs: songs(3) } });
    const result = await fetchNcmPlaylistTracks(http, "p1");
    expect(result).toHaveLength(3);
    expect(offsetsOf(calls, "playlist/track/all")).toEqual([0]);
  });

  test("pages until a page comes back under the page size", async () => {
    // 500 + 500 + 3 → three requests, stopping when the last page is short.
    const { http, calls } = fakeKy({
      "playlist/track/all": (sp: Record<string, unknown>) => {
        const offset = Number(sp.offset);
        return { songs: offset < 1000 ? songs(500, offset) : songs(3, offset) };
      },
    });
    const result = await fetchNcmPlaylistTracks(http, "p1");
    expect(result).toHaveLength(1003);
    expect(offsetsOf(calls, "playlist/track/all")).toEqual([0, 500, 1000]);
  });

  test("stops early once the known total is reached", async () => {
    const { http, calls } = fakeKy({ "playlist/track/all": { songs: songs(500) } });
    const result = await fetchNcmPlaylistTracks(http, "p1", 500);
    expect(result).toHaveLength(500);
    expect(offsetsOf(calls, "playlist/track/all")).toEqual([0]);
  });
});

describe("fetchNcmTrackDetails", () => {
  test("returns [] and makes no request for empty ids", async () => {
    const { http, calls } = fakeKy({});
    expect(await fetchNcmTrackDetails(http, [])).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  test("dedups the fetch but preserves input order and duplicates in output", async () => {
    const { http, calls } = fakeKy({
      // Echo back only the ids that "exist" (drop x).
      "song/detail": (sp: Record<string, unknown>) => ({
        songs: String(sp.ids)
          .split(",")
          .filter((id) => id !== "x")
          .map((id) => ({ id: Number(id), name: `s${id}` })),
      }),
    });
    const result = await fetchNcmTrackDetails(http, ["3", "1", "1", "2", "x"]);
    // Output follows the original ids (dups kept), missing ("x") filtered out.
    expect(result.map((t) => t.id)).toEqual(["3", "1", "1", "2"]);
    // The batch request carried unique ids, first-occurrence order.
    expect(calls).toHaveLength(1);
    expect(calls[0].searchParams.ids).toBe("3,1,2,x");
  });

  test("batches ids in groups of 100", async () => {
    const { http, calls } = fakeKy({
      "song/detail": (sp: Record<string, unknown>) => ({
        songs: String(sp.ids)
          .split(",")
          .map((id) => ({ id: Number(id), name: `s${id}` })),
      }),
    });
    const ids = Array.from({ length: 150 }, (_, i) => String(i + 1));
    const result = await fetchNcmTrackDetails(http, ids);
    expect(result).toHaveLength(150);
    expect(result.map((t) => t.id)).toEqual(ids);
    expect(calls).toHaveLength(2);
  });
});

describe("fetchNcmLyrics", () => {
  test("attaches translations to matching timestamps", async () => {
    const { http } = fakeKy({
      lyric: {
        lrc: { lyric: "[00:01.00]hello\n[00:02.00]world" },
        tlyric: { lyric: "[00:01.00]你好" },
      },
    });
    const lines = await fetchNcmLyrics(http, "t1");
    expect(lines).toHaveLength(2);
    expect(lines[0].content).toBe("hello");
    expect(lines[0].translation).toBe("你好");
    expect(lines[1].translation).toBeUndefined();
  });
});

describe("fetchNcmPlayUrls", () => {
  test("returns [] and makes no request for empty ids", async () => {
    const { http, calls } = fakeKy({});
    expect(await fetchNcmPlayUrls(http, [])).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  test("drops entries with no url and upgrades http to https", async () => {
    const { http } = fakeKy({
      "song/url/v1": {
        data: [{ id: 1, url: "http://m.example/a.mp3" }, { id: 2, url: "" }, { id: 3 }],
      },
    });
    const urls = await fetchNcmPlayUrls(http, ["1", "2", "3"]);
    expect(urls).toEqual([{ playbackId: "1", playUrl: "https://m.example/a.mp3" }]);
  });
});
