import { describe, expect, it } from "vitest";

import type { SpotifyTrack } from "./types";
import { toImages, toTrack } from "./mapper";

const spotifyTrack = (overrides: Partial<SpotifyTrack> = {}): SpotifyTrack => ({
  id: "track-1",
  name: "Track",
  duration_ms: 123_456,
  preview_url: "https://cdn.example/preview.mp3",
  explicit: false,
  track_number: 4,
  artists: [{ id: "artist-1", name: "Artist" }],
  ...overrides,
});

describe("Spotify mapper", () => {
  it("preserves Spotify image order and normalizes nullable dimensions", () => {
    expect(
      toImages([
        { url: "large", width: 640, height: 640 },
        { url: "unknown", width: null, height: null },
      ]),
    ).toEqual([
      { url: "large", width: 640, height: 640 },
      { url: "unknown", width: undefined, height: undefined },
    ]);
    expect(toImages(undefined)).toEqual([]);
  });

  it("maps source-qualified track, artist, album and preview identities", () => {
    const track = toTrack(
      spotifyTrack({
        album: {
          id: "album-1",
          name: "Album",
          images: [{ url: "cover", width: 300, height: 300 }],
        },
      }),
      undefined,
      7,
    );

    expect(track).toMatchObject({
      providerId: "spotify",
      index: 7,
      id: "track-1",
      playbackId: "track-1",
      name: "Track",
      durationMs: 123_456,
      trackNumber: 4,
      artists: [{ providerId: "spotify", id: "artist-1", name: "Artist" }],
      album: { providerId: "spotify", id: "album-1", name: "Album" },
      previewUrl: "https://cdn.example/preview.mp3",
      playUrl: "https://cdn.example/preview.mp3",
    });
  });

  it("uses the containing album fallback for simplified album tracks", () => {
    const track = toTrack(spotifyTrack({ album: undefined }), {
      id: "fallback-album",
      name: "Fallback",
      images: [],
    });

    expect(track.album).toEqual({
      providerId: "spotify",
      id: "fallback-album",
      name: "Fallback",
      images: [],
    });
  });

  it("does not claim a playable preview when Spotify returns null", () => {
    const track = toTrack(spotifyTrack({ preview_url: null }));

    expect(track.previewUrl).toBeUndefined();
    expect(track.playUrl).toBeUndefined();
  });
});
