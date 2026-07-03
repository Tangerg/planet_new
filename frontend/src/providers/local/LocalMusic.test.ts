import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as Library from "@wailsjs/go/backend/Library";
import { backend } from "@wailsjs/go/models";
import { LocalMusic } from "./LocalMusic";
import type { LocalAlbum, LocalArtist, LocalTrack } from "./types";

// The Go bridge is a generated module of async functions; mock each one the
// provider calls so tests drive the catalog without a running Wails runtime.
vi.mock("@wailsjs/go/backend/Library", () => ({
  Home: vi.fn<typeof Library.Home>(),
  AllTracks: vi.fn<typeof Library.AllTracks>(),
  AlbumDetail: vi.fn<typeof Library.AlbumDetail>(),
  ArtistDetail: vi.fn<typeof Library.ArtistDetail>(),
  Tracks: vi.fn<typeof Library.Tracks>(),
  Search: vi.fn<typeof Library.Search>(),
  Lyric: vi.fn<typeof Library.Lyric>(),
}));

function track(over: Partial<LocalTrack> = {}): LocalTrack {
  return {
    id: "t1",
    title: "Song",
    albumId: "al1",
    album: "Album",
    artistId: "ar1",
    artist: "Artist",
    trackNumber: 1,
    discNumber: 1,
    durationMs: 1000,
    year: 2001,
    genre: "",
    playUrl: "http://127.0.0.1:9/track/t1",
    coverUrl: "http://127.0.0.1:9/cover/al1",
    addedAt: 1,
    ...over,
  };
}

function album(over: Partial<LocalAlbum> = {}): LocalAlbum {
  return { id: "al1", name: "Album", artistId: "ar1", artist: "A", year: 2001, trackCount: 2, coverUrl: "", addedAt: 1, ...over }; // prettier-ignore
}

function artist(over: Partial<LocalArtist> = {}): LocalArtist {
  return { id: "ar1", name: "Artist", albumCount: 1, trackCount: 2, coverUrl: "", ...over };
}

// vi.mock-factory mocks aren't swept by the suite's restoreMocks, so reset their
// call history + implementations per test to keep the "not called" assertions honest.
beforeEach(() => {
  vi.resetAllMocks();
});

describe("LocalMusic — bridge present", () => {
  let provider: LocalMusic;

  beforeEach(() => {
    // bridgeReady() gates every method on the Wails-injected `window.go`.
    (window as unknown as { go: object }).go = {};
    provider = new LocalMusic();
  });

  afterEach(() => {
    delete (window as unknown as { go?: object }).go;
  });

  it("names itself and declares its capabilities", () => {
    expect(provider.name).toBe("Local");
    expect(provider.supports("fullPlayback")).toBe(true);
    expect(provider.supports("search")).toBe(true);
    expect(provider.supports("lyric")).toBe(true); // sidecar .lrc
    // Network-only concepts the on-device library does not have.
    expect(provider.supports("toplist")).toBe(false);
    expect(provider.supports("auth")).toBe(false);
  });

  it("projects Home into a synthetic 'all tracks' playlist plus recent rows", async () => {
    vi.mocked(Library.Home).mockResolvedValue(
      backend.Home.createFrom({
        recentTracks: [track({ id: "t1" }), track({ id: "t2" })],
        albums: [album({ trackCount: 2 }), album({ id: "al2", trackCount: 3 })],
        artists: [artist()],
      }),
    );

    const home = await provider.personalized();
    expect(home.playlists).toEqual([
      { id: "library:all", name: "全部歌曲", images: [], totalTracks: 5 },
    ]);
    expect(home.albums).toHaveLength(2);
    expect(home.artists).toHaveLength(1);
    expect(home.tracks?.map((t) => t.id)).toEqual(["t1", "t2"]);
  });

  it("emits no synthetic playlist when the library is empty", async () => {
    vi.mocked(Library.Home).mockResolvedValue(
      backend.Home.createFrom({ recentTracks: [], albums: [], artists: [] }),
    );
    expect((await provider.personalized()).playlists).toEqual([]);
  });

  it("resolves the 'all tracks' playlist from the full catalog", async () => {
    vi.mocked(Library.AllTracks).mockResolvedValue([track({ id: "t1" }), track({ id: "t2" })]);
    const playlist = await provider.playlistDetail("library:all");
    expect(playlist).toMatchObject({ id: "library:all", name: "全部歌曲", totalTracks: 2 });
    expect(playlist.tracks?.map((t) => t.id)).toEqual(["t1", "t2"]);
    expect(Library.AllTracks).toHaveBeenCalledOnce();
  });

  it("returns an empty shell for an unknown playlist id without hitting the catalog", async () => {
    const playlist = await provider.playlistDetail("something-else");
    expect(playlist).toEqual({
      id: "something-else",
      name: "",
      images: [],
      tracks: [],
      totalTracks: 0,
    });
    expect(Library.AllTracks).not.toHaveBeenCalled();
  });

  it("assembles an album with its tracks, and an empty shell when missing", async () => {
    vi.mocked(Library.AlbumDetail).mockResolvedValueOnce(
      backend.AlbumDetail.createFrom({
        album: album({ id: "al1", name: "Album" }),
        tracks: [track()],
      }),
    );
    const found = await provider.albumDetail("al1");
    expect(found).toMatchObject({ id: "al1", name: "Album" });
    expect(found.tracks).toHaveLength(1);

    // A blank album id signals "not found" → an empty shell, tracks untouched.
    vi.mocked(Library.AlbumDetail).mockResolvedValueOnce(
      backend.AlbumDetail.createFrom({ album: album({ id: "" }), tracks: [] }),
    );
    expect(await provider.albumDetail("nope")).toEqual({
      id: "nope",
      name: "",
      images: [],
      artists: [],
    });
  });

  it("assembles an artist with top tracks + albums, and a shell when missing", async () => {
    vi.mocked(Library.ArtistDetail).mockResolvedValueOnce(
      backend.ArtistDetail.createFrom({
        artist: artist({ id: "ar1", name: "Artist" }),
        albums: [album()],
        tracks: [track(), track({ id: "t2" })],
      }),
    );
    const found = await provider.artistDetail("ar1");
    expect(found).toMatchObject({ id: "ar1", name: "Artist" });
    expect(found.topTracks).toHaveLength(2);
    expect(found.albums).toHaveLength(1);

    vi.mocked(Library.ArtistDetail).mockResolvedValueOnce(
      backend.ArtistDetail.createFrom({ artist: artist({ id: "" }), albums: [], tracks: [] }),
    );
    expect(await provider.artistDetail("nope")).toEqual({ id: "nope", name: "", images: [] });
  });

  it("maps requested track details and short-circuits an empty id list", async () => {
    vi.mocked(Library.Tracks).mockResolvedValue([track({ id: "t1" }), track({ id: "t2" })]);
    expect((await provider.trackDetails(["t1", "t2"])).map((t) => t.id)).toEqual(["t1", "t2"]);

    expect(await provider.trackDetails([])).toEqual([]);
    expect(Library.Tracks).toHaveBeenCalledOnce(); // not called for the empty list
  });

  it("resolves play urls from the loopback tracks, dropping any without a stream", async () => {
    vi.mocked(Library.Tracks).mockResolvedValue([
      track({ id: "t1", playUrl: "http://127.0.0.1:9/track/t1" }),
      track({ id: "t2", playUrl: "" }),
    ]);
    expect(await provider.playUrls(["t1", "t2"])).toEqual([
      { playbackId: "t1", playUrl: "http://127.0.0.1:9/track/t1" },
    ]);
    expect(await provider.playUrls([])).toEqual([]);
  });

  it("searches the catalog and never reports playlists", async () => {
    vi.mocked(Library.Search).mockResolvedValue(
      backend.SearchResult.createFrom({
        tracks: [track()],
        albums: [album()],
        artists: [artist()],
      }),
    );
    const result = await provider.search("song");
    expect(result.tracks).toHaveLength(1);
    expect(result.albums).toHaveLength(1);
    expect(result.artists).toHaveLength(1);
    expect(result.playlists).toEqual([]);
  });

  it("does not search for a blank query", async () => {
    const empty = { tracks: [], artists: [], albums: [], playlists: [] };
    expect(await provider.search("   ")).toEqual(empty);
    expect(Library.Search).not.toHaveBeenCalled();
  });

  it("parses the sidecar .lrc returned by the bridge into timed lines", async () => {
    vi.mocked(Library.Lyric).mockResolvedValue("[00:01.000]hello\n[00:02.500]world\n");
    const lines = await provider.lyric("t1");
    expect(Library.Lyric).toHaveBeenCalledWith("t1");
    expect(lines).toEqual([
      { duration: 1000, content: "hello" },
      { duration: 2500, content: "world" },
    ]);
  });

  it("returns no lines when the track has no sidecar lyric", async () => {
    vi.mocked(Library.Lyric).mockResolvedValue("");
    expect(await provider.lyric("t1")).toEqual([]);
  });
});

describe("LocalMusic — no bridge (plain browser)", () => {
  let provider: LocalMusic;

  beforeEach(() => {
    delete (window as unknown as { go?: object }).go;
    provider = new LocalMusic();
  });

  it("degrades every read to an empty result without touching the bridge", async () => {
    expect(await provider.personalized()).toEqual({ playlists: [] });
    expect(await provider.playlistDetail("library:all")).toEqual({
      id: "library:all",
      name: "",
      images: [],
      tracks: [],
      totalTracks: 0,
    });
    expect(await provider.albumDetail("al1")).toEqual({ id: "al1", name: "", images: [], artists: [] }); // prettier-ignore
    expect(await provider.artistDetail("ar1")).toEqual({ id: "ar1", name: "", images: [] });
    expect(await provider.trackDetails(["t1"])).toEqual([]);
    expect(await provider.playUrls(["t1"])).toEqual([]);
    expect(await provider.search("song")).toEqual({
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
    });
    expect(await provider.lyric("t1")).toEqual([]);

    for (const fn of [
      Library.Home,
      Library.AllTracks,
      Library.AlbumDetail,
      Library.ArtistDetail,
      Library.Tracks,
      Library.Search,
      Library.Lyric,
    ]) {
      // prettier-ignore
      expect(fn).not.toHaveBeenCalled();
    }
  });
});
