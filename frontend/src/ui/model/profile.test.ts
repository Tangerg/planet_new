import { describe, expect, it } from "vitest";

import type { VibeCollection, VibeTrack } from "./vibe";
import {
  profileAuthActionLabel,
  profileConnectionLabel,
  profileFollowerLabel,
  profileFollowingLabel,
  profilePlaylistItems,
  profileScreenModel,
} from "./profile";

const playlist = (id: string, overrides: Partial<VibeCollection> = {}): VibeCollection => ({
  id,
  name: id,
  kind: "Playlist",
  coverSeed: 1,
  tracks: [],
  ...overrides,
});

const track = (id: string): VibeTrack => ({
  id,
  title: id,
  name: id,
  artist: "Artist",
  coverSeed: 1,
  durSec: 10,
  duration: "0:10",
});

describe("profile screen model", () => {
  it("derives connection and auth labels from provider support/login state", () => {
    expect(profileConnectionLabel(true, true)).toBe("Connected");
    expect(profileConnectionLabel(false, true)).toBe("Not connected");
    expect(profileConnectionLabel(false, false)).toBe("Local profile");
    expect(profileAuthActionLabel(true, true)).toBe("Log out");
    expect(profileAuthActionLabel(false, true)).toBe("Log in with NetEase");
    expect(profileAuthActionLabel(false, false)).toBeUndefined();
  });

  it("keeps the anonymous demo stats until a real account is connected", () => {
    expect(profileFollowerLabel({ followers: 1234 }, false)).toBe("598");
    expect(profileFollowingLabel({ following: 88 }, false)).toBe("6");
    expect(profileFollowerLabel({ followers: 1234 }, true)).toBe("1.2K");
    expect(profileFollowingLabel({ following: 88 }, true)).toBe("88");
  });

  it("limits playlist rows and carries active/track-count state", () => {
    const items = profilePlaylistItems(
      [
        playlist("p1", { trackCount: 10 }),
        playlist("p2", { tracks: [track("t1")] }),
        playlist("p3"),
        playlist("p4"),
        playlist("p5"),
      ],
      1,
    );

    expect(items.map((item) => item.playlist.id)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(items.map((item) => item.trackCount)).toEqual([10, 1, 0, 0]);
    expect(items.map((item) => item.active)).toEqual([false, true, false, false]);
  });

  it("collects the profile view model", () => {
    expect(
      profileScreenModel({
        account: { name: "  Monster  ", followers: 17, following: 30 },
        activePlaylistIndex: 0,
        loggedIn: true,
        playlists: [playlist("liked")],
        supported: true,
      }),
    ).toMatchObject({
      authActionLabel: "Log out",
      connectionLabel: "Connected",
      followers: "17",
      following: "30",
      name: "Monster",
      playlists: [{ active: true, playlist: { id: "liked" } }],
    });
  });
});
