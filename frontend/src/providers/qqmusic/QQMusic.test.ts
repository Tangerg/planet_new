import { describe, expect, it } from "vitest";

import { fakeKy, type FakeRoute } from "../ncm/fake-ky";
import { QQMusic } from "./QQMusic";

function provider(routes: Record<string, FakeRoute>): QQMusic {
  const { http } = fakeKy(routes);
  return new QQMusic({ host: "http://qq.test", http });
}

const unavailable = () => {
  throw new Error("upstream unavailable");
};

describe("QQMusic adapter error semantics", () => {
  it("returns not-found instead of manufacturing blank detail entities", async () => {
    const subject = provider({
      getSongListDetail: { response: { cdlist: [] } },
      getAlbumInfo: { response: {} },
    });

    await expect(subject.playlistDetail("missing")).resolves.toBeUndefined();
    await expect(subject.albumDetail("missing")).resolves.toBeUndefined();
  });

  it.each([
    ["search", (subject: QQMusic) => subject.search("query"), "getSmartbox"],
    ["toplists", (subject: QQMusic) => subject.toplists(), "getTopLists"],
    ["toplist detail", (subject: QQMusic) => subject.toplistDetail("1"), "getRanks"],
  ])(
    "propagates a failed %s request instead of returning successful empty data",
    async (_, run, path) => {
      const subject = provider({ [path]: unavailable });

      await expect(run(subject)).rejects.toThrow("upstream unavailable");
    },
  );

  it("keeps useful artist data when one parallel section fails", async () => {
    const subject = provider({
      getSingerHotsong: unavailable,
      getSingerDesc: {
        response: {
          data: { basic_info: { name: "Artist" }, info: { desc: "Biography" } },
        },
      },
    });

    await expect(subject.artistDetail("artist-1")).resolves.toMatchObject({
      id: "artist-1",
      name: "Artist",
      description: "Biography",
      topTracks: [],
    });
  });

  it("fails artist detail when every parallel section fails", async () => {
    const subject = provider({
      getSingerHotsong: unavailable,
      getSingerDesc: unavailable,
    });

    await expect(subject.artistDetail("artist-1")).rejects.toThrow(
      "QQ Music artist detail (artist-1) failed",
    );
  });

  it("returns available personalized sections and fails only when all sections fail", async () => {
    const partial = provider({
      getSongLists: {
        response: {
          data: { list: [{ dissid: 1, dissname: "Playlist", songnum: 2 }] },
        },
      },
      getNewDisks: unavailable,
      getSingerList: unavailable,
    });

    await expect(partial.personalized()).resolves.toMatchObject({
      playlists: [{ id: "1", name: "Playlist", totalTracks: 2 }],
      albums: [],
      artists: [],
    });

    const failed = provider({
      getSongLists: unavailable,
      getNewDisks: unavailable,
      getSingerList: unavailable,
    });
    await expect(failed.personalized()).rejects.toThrow("QQ Music personalized sections failed");
  });
});
