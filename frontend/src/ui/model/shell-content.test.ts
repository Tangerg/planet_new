import { describe, expect, it } from "vitest";

import type { ScreenData, VibeCollection, VibeMusicVideo, VibeTrack } from "./vibe";
import { shellContentQueryPlan, shellLibraryData, shellMusicVideoRail } from "./shell-content";

const track = (id: string): VibeTrack => ({
  id,
  title: id,
  name: id,
  artist: "Artist",
  coverSeed: 1,
  durSec: 10,
  duration: "0:10",
});

const playlist = (id: string): VibeCollection => ({
  id,
  name: id,
  kind: "playlist",
  coverSeed: 1,
  tracks: [track(`${id}-track`)],
});

const catalog = (playlists: VibeCollection[] = [playlist("catalog")]): ScreenData => ({
  playlists,
  albums: [],
  artists: [],
  allTracks: [],
});

const video = (id: string): VibeMusicVideo => ({
  id,
  title: id,
  name: id,
  artist: "Artist",
  coverSeed: 1,
  duration: "00:10",
  durSec: 10,
});

describe("shell content model", () => {
  it("keeps anonymous catalog data until real user playlists are available", () => {
    const anonymous = catalog();
    const userPlaylists = [playlist("user")];

    expect(shellLibraryData(anonymous, false, userPlaylists)).toBe(anonymous);
    expect(shellLibraryData(anonymous, true, [])).toBe(anonymous);

    const personalized = shellLibraryData(anonymous, true, userPlaylists);
    expect(personalized).not.toBe(anonymous);
    expect(personalized.playlists.map((item) => item.id)).toEqual(["user"]);
    expect(personalized.playlists).not.toBe(userPlaylists);
  });

  it("plans shell content queries by active surface", () => {
    expect(shellContentQueryPlan("np")).toEqual({
      loadTrackComments: true,
      loadMusicVideoRail: false,
      loadMusicVideoComments: false,
    });
    expect(shellContentQueryPlan("comments").loadTrackComments).toBe(true);
    expect(shellContentQueryPlan("mv-detail")).toEqual({
      loadTrackComments: false,
      loadMusicVideoRail: true,
      loadMusicVideoComments: false,
    });
    expect(shellContentQueryPlan("mv-theater")).toEqual({
      loadTrackComments: false,
      loadMusicVideoRail: true,
      loadMusicVideoComments: true,
    });
    expect(shellContentQueryPlan("xmb")).toEqual({
      loadTrackComments: false,
      loadMusicVideoRail: false,
      loadMusicVideoComments: false,
    });
  });

  it("prefers fetched artist videos and falls back to navigation-provided related videos", () => {
    const fetched = [video("fetched")];
    const fallback = [video("fallback")];

    expect(shellMusicVideoRail(fetched, fallback).map((item) => item.id)).toEqual(["fetched"]);
    expect(shellMusicVideoRail([], fallback).map((item) => item.id)).toEqual(["fallback"]);
    expect(shellMusicVideoRail([], fallback)).not.toBe(fallback);
  });
});
