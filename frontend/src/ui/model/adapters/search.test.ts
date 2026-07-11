import { describe, expect, it } from "vitest";

import { toVibeSearchResults } from "./search";
import { ProviderId } from "@domain/model/provider-id";

const TEST_PROVIDER_ID = ProviderId.of("test");

describe("search projection boundary", () => {
  it("projects provider search results into vibe result groups", () => {
    const result = toVibeSearchResults({
      tracks: [
        {
          providerId: TEST_PROVIDER_ID,
          id: "t1",
          name: "Song",
          artists: [{ providerId: TEST_PROVIDER_ID, id: "ar1", name: "Singer" }],
          album: {
            providerId: TEST_PROVIDER_ID,
            id: "al1",
            name: "Album",
            images: [{ url: "track.jpg" }],
          },
          durationMs: 123_000,
        },
      ],
      artists: [
        {
          providerId: TEST_PROVIDER_ID,
          id: "ar1",
          name: "Singer",
          images: [{ url: "artist.jpg" }],
        },
      ],
      albums: [
        {
          providerId: TEST_PROVIDER_ID,
          id: "al1",
          name: "Album",
          images: [{ url: "album.jpg" }],
          artists: [],
        },
      ],
      playlists: [
        {
          providerId: TEST_PROVIDER_ID,
          id: "p1",
          name: "Playlist",
          images: [{ url: "playlist.jpg" }],
        },
      ],
    });

    expect(result.tracks[0]).toEqual(
      expect.objectContaining({
        id: "t1",
        title: "Song",
        artist: "Singer",
        album: "Album",
        image: "track.jpg",
      }),
    );
    expect(result.artists[0]).toEqual(
      expect.objectContaining({ id: "ar1", name: "Singer", image: "artist.jpg" }),
    );
    expect(result.albums[0]).toEqual(
      expect.objectContaining({ id: "al1", name: "Album", kind: "Album", image: "album.jpg" }),
    );
    expect(result.playlists[0]).toEqual(
      expect.objectContaining({
        id: "p1",
        name: "Playlist",
        kind: "Playlist",
        image: "playlist.jpg",
      }),
    );
  });

  it("uses empty groups for missing provider dimensions", () => {
    expect(toVibeSearchResults({ tracks: [], artists: [], albums: [], playlists: [] })).toEqual({
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
    });
    expect(toVibeSearchResults()).toEqual({
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
    });
  });
});
