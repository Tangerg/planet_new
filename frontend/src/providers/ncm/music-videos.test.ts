import { describe, expect, test, vi } from "vitest";

import { fakeKy } from "./fake-ky";
import { fetchNcmArtistMusicVideos, fetchNcmMusicVideoDetail } from "./music-videos";

describe("fetchNcmMusicVideoDetail", () => {
  test("returns detail and marks playback resolution when the URL endpoint responds", async () => {
    const { http } = fakeKy({
      "mv/detail": { data: { id: 1, name: "MV", artistName: "Artist" } },
      "mv/url": { data: { url: "http://cdn.example/mv.mp4", r: 1080 } },
      "mv/detail/info": { commentCount: 2, likedCount: 3, shareCount: 4 },
    });

    await expect(fetchNcmMusicVideoDetail(http, "1")).resolves.toMatchObject({
      id: "1",
      name: "MV",
      playUrl: "https://cdn.example/mv.mp4",
      playbackResolved: true,
      quality: 1080,
      commentCount: 2,
      likedCount: 3,
      shareCount: 4,
    });
  });

  test("keeps the MV detail when optional playback metadata fails, but reports it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { http } = fakeKy({
      "mv/detail": { data: { id: 1, name: "MV" } },
      "mv/url": () => {
        throw new Error("url down");
      },
      "mv/detail/info": {},
    });

    await expect(fetchNcmMusicVideoDetail(http, "1")).resolves.toMatchObject({
      id: "1",
      name: "MV",
      playbackResolved: true,
    });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  test("lets artist MV failures bubble to the application read boundary", async () => {
    const { http } = fakeKy({
      "artist/mv": () => {
        throw new Error("artist mv down");
      },
    });

    await expect(fetchNcmArtistMusicVideos(http, "artist-1")).rejects.toThrow("artist mv down");
  });
});
