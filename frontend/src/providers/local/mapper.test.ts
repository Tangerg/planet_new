import { describe, expect, it } from "vitest";

import { toAlbum, toArtist, toTrack } from "./mapper";
import type { LocalAlbum, LocalArtist, LocalTrack } from "./types";

/** Full Go DTOs with sane defaults so each test overrides only what it asserts. */
function mkTrack(over: Partial<LocalTrack> = {}): LocalTrack {
  return {
    id: "t1",
    title: "Song",
    albumId: "al1",
    album: "Album",
    artistId: "ar1",
    artist: "Artist",
    trackNumber: 3,
    discNumber: 1,
    durationMs: 210_000,
    year: 2001,
    genre: "Rock",
    playUrl: "http://127.0.0.1:52341/track/t1",
    coverUrl: "http://127.0.0.1:52341/cover/al1",
    addedAt: 1_700_000_000,
    ...over,
  };
}

function mkAlbum(over: Partial<LocalAlbum> = {}): LocalAlbum {
  return {
    id: "al1",
    name: "Album",
    artistId: "ar1",
    artist: "Artist",
    year: 2001,
    trackCount: 12,
    coverUrl: "http://127.0.0.1:52341/cover/al1",
    addedAt: 1_700_000_000,
    ...over,
  };
}

describe("local mapper — toTrack", () => {
  it("renames the Go DTO fields onto a domain Track", () => {
    const track = toTrack(mkTrack());
    expect(track).toMatchObject({
      id: "t1",
      name: "Song",
      durationMs: 210_000,
      trackNumber: 3,
      discNumber: 1,
    });
    expect(track.artists).toEqual([{ id: "ar1", name: "Artist" }]);
    expect(track.album).toMatchObject({ id: "al1", name: "Album" });
    expect(track.album?.artists).toEqual([{ id: "ar1", name: "Artist" }]);
    expect(track.album?.images).toEqual([{ url: "http://127.0.0.1:52341/cover/al1" }]);
  });

  it("carries the loopback stream as both the playback key and the resolved url", () => {
    // A local file needs no playUrls() round-trip: playbackId = id and the url
    // is already present, so the track is immediately playable.
    const track = toTrack(mkTrack({ id: "t9", playUrl: "http://127.0.0.1:9/track/t9" }));
    expect(track.playbackId).toBe("t9");
    expect(track.playUrl).toBe("http://127.0.0.1:9/track/t9");
    expect(track.available).toBe(true);
  });

  it("drops a blank artist from both the track and its nested album", () => {
    const track = toTrack(mkTrack({ artist: "", artistId: "" }));
    expect(track.artists).toEqual([]);
    expect(track.album?.artists).toEqual([]);
  });

  it("omits an empty cover, an absent stream, and zeroed track/disc numbers", () => {
    const track = toTrack(mkTrack({ coverUrl: "", playUrl: "", trackNumber: 0, discNumber: 0 }));
    expect(track.album?.images).toEqual([]);
    expect(track.playUrl).toBeUndefined();
    expect(track.trackNumber).toBeUndefined();
    expect(track.discNumber).toBeUndefined();
  });
});

describe("local mapper — toAlbum", () => {
  it("maps an album and encodes the year as a local-midnight release date", () => {
    const album = toAlbum(mkAlbum());
    expect(album).toMatchObject({ id: "al1", name: "Album", totalTracks: 12 });
    expect(album.artists).toEqual([{ id: "ar1", name: "Artist" }]);
    expect(album.images).toEqual([{ url: "http://127.0.0.1:52341/cover/al1" }]);
    // Local midnight (no Z) so Album.year()'s Date parse never drifts a year across zones.
    expect(album.releaseDate).toBe("2001-01-01T00:00:00");
  });

  it("leaves the release date and track count unset when the tags had none", () => {
    const album = toAlbum(mkAlbum({ year: 0, trackCount: 0 }));
    expect(album.releaseDate).toBeUndefined();
    expect(album.totalTracks).toBeUndefined();
  });
});

describe("local mapper — toArtist", () => {
  it("maps an artist with its cover", () => {
    const artist = toArtist({
      id: "ar1",
      name: "Artist",
      albumCount: 2,
      trackCount: 20,
      coverUrl: "http://127.0.0.1:52341/artist/ar1",
    } as LocalArtist);
    expect(artist).toEqual({
      id: "ar1",
      name: "Artist",
      images: [{ url: "http://127.0.0.1:52341/artist/ar1" }],
    });
  });

  it("yields an empty image list when the artist has no cover", () => {
    expect(toArtist({ id: "ar1", name: "A", coverUrl: "" } as LocalArtist).images).toEqual([]);
  });
});
