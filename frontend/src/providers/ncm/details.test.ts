import { describe, expect, test } from "vitest";

import { fakeKy } from "./fake-ky";
import { fetchNcmAlbumDetail, fetchNcmArtistDetail, fetchNcmPlaylistDetail } from "./details";

describe("fetchNcmPlaylistDetail", () => {
  test("merges the detail node with its separately-paged tracks", async () => {
    const { http } = fakeKy({
      "playlist/detail": { playlist: { id: 1, name: "P", trackCount: 2 } },
      "playlist/track/all": {
        songs: [
          { id: 10, name: "a" },
          { id: 11, name: "b" },
        ],
      },
    });
    const playlist = await fetchNcmPlaylistDetail(http, "1");
    expect(playlist.id).toBe("1");
    expect(playlist.name).toBe("P");
    expect(playlist.tracks).toHaveLength(2);
    expect(playlist.tracks?.[0]?.id).toBe("10");
  });

  test("falls back to the detail node's own tracks when track paging fails", async () => {
    const { http } = fakeKy({
      "playlist/detail": {
        playlist: { id: 1, name: "P", trackCount: 1, tracks: [{ id: 99, name: "z" }] },
      },
      "playlist/track/all": () => {
        throw new Error("boom");
      },
    });
    const playlist = await fetchNcmPlaylistDetail(http, "1");
    expect(playlist.tracks).toHaveLength(1);
    expect(playlist.tracks?.[0]?.id).toBe("99");
  });
});

describe("fetchNcmAlbumDetail", () => {
  test("maps the album node together with its songs", async () => {
    const { http } = fakeKy({
      album: { album: { id: 5, name: "Al", picUrl: "http://p" }, songs: [{ id: 1, name: "x" }] },
    });
    const album = await fetchNcmAlbumDetail(http, "5");
    expect(album.id).toBe("5");
    expect(album.name).toBe("Al");
    expect(album.tracks).toHaveLength(1);
  });
});

describe("fetchNcmArtistDetail", () => {
  test("fans out to four endpoints and assembles one artist", async () => {
    const { http } = fakeKy({
      artists: {
        artist: { id: 7, name: "Ar", img1v1Url: "http://i" },
        hotSongs: [
          { id: 1, name: "h1" },
          { id: 2, name: "h2" },
        ],
      },
      "artist/desc": { briefDesc: "brief", introduction: [{ txt: "long" }] },
      "artist/album": { hotAlbums: [{ id: 9, name: "A9" }] },
      "simi/artist": { artists: [{ id: 3, name: "Sim" }] },
    });
    const artist = await fetchNcmArtistDetail(http, "7");
    expect(artist.id).toBe("7");
    expect(artist.name).toBe("Ar");
    expect(artist.topTracks).toHaveLength(2);
    expect((artist.topTracks ?? []).map((t) => t.index)).toEqual([1, 2]);
    expect(artist.albums).toHaveLength(1);
    expect(artist.similar).toHaveLength(1);
    // briefDesc wins over the introduction fallback.
    expect(artist.description).toBe("brief");
  });

  test("tolerates a failing sub-request and uses the description fallback", async () => {
    const { http } = fakeKy({
      artists: { artist: { id: 7, name: "Ar" }, hotSongs: [] },
      "artist/desc": { introduction: [{ txt: "from-introduction" }] },
      "artist/album": () => {
        throw new Error("albums down");
      },
      "simi/artist": { artists: [] },
    });
    const artist = await fetchNcmArtistDetail(http, "7");
    expect(artist.albums).toEqual([]);
    expect(artist.description).toBe("from-introduction");
  });

  test("propagates failure of the primary artist endpoint", async () => {
    const { http } = fakeKy({
      artists: () => {
        throw new Error("artist unavailable");
      },
      "artist/desc": {},
      "artist/album": {},
      "simi/artist": {},
    });

    await expect(fetchNcmArtistDetail(http, "7")).rejects.toThrow("artist unavailable");
  });
});
