import { describe, expect, it } from "vitest";

import type { VibeCollection, VibeTrack } from "./vibe";
import {
  profileAuthActionKey,
  profileConnectionKey,
  profileSocialCounts,
  profileMembership,
  profilePlaylistItems,
  profileScreenModel,
} from "./profile";

const playlist = (id: string, overrides: Partial<VibeCollection> = {}): VibeCollection => ({
  id,
  name: id,
  kind: "playlist",
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

const account = (overrides: Record<string, unknown> = {}) => ({
  id: "account",
  name: "Listener",
  ...overrides,
});

describe("profile screen model", () => {
  it("names connection and auth messages from provider support/login state", () => {
    expect(profileConnectionKey(true, true)).toBe("profile.connected");
    expect(profileConnectionKey(false, true)).toBe("profile.notConnected");
    expect(profileConnectionKey(false, false)).toBe("profile.localProfile");
    expect(profileAuthActionKey(true, true)).toBe("profile.logout");
    expect(profileAuthActionKey(false, true)).toBe("profile.login");
    expect(profileAuthActionKey(false, false)).toBeUndefined();
  });

  it("reports social counts only for a connected account", () => {
    expect(profileSocialCounts(account({ followers: 1234 }), false)).toBeUndefined();
    expect(profileSocialCounts(null, true)).toBeUndefined();
    expect(profileSocialCounts(account({ followers: 1234, following: 88 }), true)).toEqual({
      followers: "1.2K",
      following: "88",
    });
  });

  it("marks membership only for a connected premium account", () => {
    expect(profileMembership(account({ premium: true }), true)).toBe(true);
    expect(profileMembership(account({ premium: true }), false)).toBe(false); // not connected
    expect(profileMembership(account({ premium: false }), true)).toBe(false);
    expect(profileMembership(null, true)).toBe(false);
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
        account: {
          id: "account",
          name: "  Monster  ",
          followers: 17,
          following: 30,
          premium: true,
        },
        activePlaylistIndex: 0,
        loggedIn: true,
        playlists: [playlist("liked")],
        supported: true,
      }),
    ).toMatchObject({
      authActionKey: "profile.logout",
      connectionKey: "profile.connected",
      social: { followers: "17", following: "30" },
      name: { text: "Monster" },
      membership: true,
      playlists: [{ active: true, playlist: { id: "liked" } }],
    });
  });

  it("names an anonymous listener instead of inventing a person", () => {
    const anonymous = profileScreenModel({
      account: null,
      activePlaylistIndex: 0,
      loggedIn: false,
      playlists: [],
      supported: true,
    });

    expect(anonymous.name).toEqual({ key: "profile.anonymous" });
    expect(anonymous.social).toBeUndefined();
  });
});
