import { describe, expect, it } from "vitest";

import type { VibeTrack } from "./vibe";
import {
  appendHistoryTrack,
  likesAreAccountBacked,
  likeSyncMergePlan,
  likedSetForSource,
  optimisticLikeUpdate,
  toggleLikedId,
  toggleLocalLiked,
  willLikeId,
} from "./likes";

const track = (id: string): VibeTrack => ({
  id,
  title: id,
  name: id,
  artist: "Artist",
  coverSeed: 1,
  durSec: 10,
  duration: "0:10",
});

describe("likes model", () => {
  it("enters account-backed mode only when logged in and the provider supports a library", () => {
    expect(likesAreAccountBacked(true, true)).toBe(true);
    expect(likesAreAccountBacked(true, false)).toBe(false);
    expect(likesAreAccountBacked(false, true)).toBe(false);
  });

  it("uses account ids only when likes are provider-synced", () => {
    const localLiked = new Set(["local"]);

    expect([...likedSetForSource({ accountIds: ["remote"], localLiked, synced: true })]).toEqual([
      "remote",
    ]);
    expect([...likedSetForSource({ accountIds: ["remote"], localLiked, synced: false })]).toEqual([
      "local",
    ]);
  });

  it("toggles ids for optimistic account-backed likes", () => {
    expect(toggleLikedId(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleLikedId(["a", "b"], "a")).toEqual(["b"]);
    expect(willLikeId(["a"], "b")).toBe(true);
    expect(willLikeId(new Set(["a"]), "a")).toBe(false);
    expect(optimisticLikeUpdate(["a"], "b")).toEqual({ ids: ["a", "b"], willLike: true });
  });

  it("toggles local liked ids without mutating the previous set", () => {
    const previous = new Set(["a"]);
    const next = toggleLocalLiked(previous, "a");
    const added = toggleLocalLiked(previous, "b");

    expect([...previous]).toEqual(["a"]);
    expect([...next]).toEqual([]);
    expect([...added]).toEqual(["a", "b"]);
  });

  it("records play history while dropping consecutive duplicates", () => {
    const first = track("first");
    const second = track("second");

    expect(appendHistoryTrack([], undefined)).toEqual([]);
    expect(appendHistoryTrack([first], first)).toEqual([first]);
    expect(appendHistoryTrack([first], second)).toEqual([first, second]);
  });

  it("plans one anonymous-like merge per synced login session", () => {
    const localLiked = new Set(["a", "b"]);

    expect(likeSyncMergePlan({ localLiked, mergedThisSession: false, synced: false })).toEqual({
      idsToSync: [],
      mergedThisSession: false,
    });
    expect(likeSyncMergePlan({ localLiked, mergedThisSession: false, synced: true })).toEqual({
      idsToSync: ["a", "b"],
      mergedThisSession: true,
    });
    expect(likeSyncMergePlan({ localLiked, mergedThisSession: true, synced: true })).toEqual({
      idsToSync: [],
      mergedThisSession: true,
    });
    expect(
      likeSyncMergePlan({ localLiked: new Set(), mergedThisSession: false, synced: true }),
    ).toEqual({
      idsToSync: [],
      mergedThisSession: true,
    });
  });
});
