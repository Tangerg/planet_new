import { describe, expect, it } from "vitest";

import { fakeKy, type FakeRoute } from "../ncm/fake-ky";
import { Spotify } from "./Spotify";

function provider(routes: Record<string, FakeRoute>, market?: string): Spotify {
  const { http } = fakeKy(routes);
  return new Spotify({
    clientId: "client",
    clientSecret: "secret",
    api: http,
    market,
  });
}

const unavailable = () => {
  throw new Error("upstream unavailable");
};

const track = (id: string, previewUrl: string | null = `https://cdn.example/${id}.mp3`) => ({
  id,
  name: id,
  duration_ms: 1000,
  preview_url: previewUrl,
  artists: [{ id: "artist", name: "Artist" }],
});

describe("Spotify adapter", () => {
  it("filters unavailable playlist entries and maps stable source identity", async () => {
    const subject = provider({
      "playlists/playlist-1": {
        id: "playlist-1",
        name: "Playlist",
        description: null,
        images: [],
        owner: { id: "owner", display_name: null },
        tracks: { total: 2, items: [{ track: null }, { track: track("track-1") }] },
      },
    });

    await expect(subject.playlistDetail("playlist-1")).resolves.toMatchObject({
      providerId: "spotify",
      id: "playlist-1",
      description: "",
      owner: { id: "owner", displayName: "owner" },
      tracks: [{ providerId: "spotify", id: "track-1", index: 1 }],
    });
  });

  it("keeps artist basics when top tracks fail but propagates a failed basics request", async () => {
    const partial = provider({
      "artists/artist-1": {
        id: "artist-1",
        name: "Artist",
        images: [{ url: "cover", width: null, height: null }],
        genres: ["genre"],
      },
      "artists/artist-1/top-tracks": unavailable,
    });

    await expect(partial.artistDetail("artist-1")).resolves.toMatchObject({
      id: "artist-1",
      name: "Artist",
      genres: ["genre"],
      topTracks: [],
    });

    const failed = provider({
      "artists/artist-1": unavailable,
      "artists/artist-1/top-tracks": { tracks: [] },
    });
    await expect(failed.artistDetail("artist-1")).rejects.toThrow("upstream unavailable");
  });

  it("batches playback resolution at Spotify's 50-id boundary", async () => {
    const seen: string[][] = [];
    const subject = provider({
      tracks: (params: Record<string, unknown>) => {
        const ids = String(params.ids).split(",");
        seen.push(ids);
        return {
          tracks: ids.map((id, index) =>
            index === 0 ? track(id) : index === 1 ? track(id, null) : null,
          ),
        };
      },
    });
    const ids = Array.from({ length: 51 }, (_, index) => `track-${index + 1}`);

    const urls = await subject.playUrls(ids);

    expect(seen.map((batch) => batch.length)).toEqual([50, 1]);
    expect(urls).toEqual([
      { playbackId: "track-1", playUrl: "https://cdn.example/track-1.mp3" },
      { playbackId: "track-51", playUrl: "https://cdn.example/track-51.mp3" },
    ]);
  });

  it("keeps required new releases when optional discovery searches fail", async () => {
    const subject = provider(
      {
        "browse/new-releases": {
          albums: {
            items: [
              {
                id: "album-1",
                name: "Album",
                images: [],
                total_tracks: 2,
                artists: [{ id: "artist-1", name: "Artist" }],
              },
            ],
          },
        },
        search: unavailable,
      },
      "JP",
    );

    await expect(subject.personalized()).resolves.toMatchObject({
      albums: [{ id: "album-1", totalTracks: 2 }],
      playlists: [],
      artists: [],
    });
  });
});
