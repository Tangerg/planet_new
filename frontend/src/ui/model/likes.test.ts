import { describe, expect, it } from "vitest";

import {
  likesAreAccountBacked,
  likeSyncMergePlan,
  likedSetForSource,
  optimisticLikeUpdate,
  toggleLikedId,
  toggleLocalLiked,
  withoutLikedSource,
  willLikeId,
} from "./likes";
import { ProviderId } from "@domain/model/provider-id";
import { TrackKey } from "@domain/model/entity-key";

const TEST_PROVIDER_ID = ProviderId.of("test");
const OTHER_PROVIDER_ID = ProviderId.of("other");

describe("likes model", () => {
  it("enters account-backed mode only when logged in and the provider supports a library", () => {
    expect(likesAreAccountBacked(true, true)).toBe(true);
    expect(likesAreAccountBacked(true, false)).toBe(false);
    expect(likesAreAccountBacked(false, true)).toBe(false);
  });

  it("namespaces account ids and preserves local likes from other sources", () => {
    const local = TrackKey.of(TEST_PROVIDER_ID, "local");
    const other = TrackKey.of(OTHER_PROVIDER_ID, "local");
    const localLiked = new Set([local, other]);

    expect([
      ...likedSetForSource({
        providerId: TEST_PROVIDER_ID,
        accountIds: ["remote"],
        localLiked,
        synced: true,
      }),
    ]).toEqual([other, TrackKey.of(TEST_PROVIDER_ID, "remote")]);
    expect([
      ...likedSetForSource({
        providerId: TEST_PROVIDER_ID,
        accountIds: ["remote"],
        localLiked,
        synced: false,
      }),
    ]).toEqual([local, other]);
  });

  it("toggles ids for optimistic account-backed likes", () => {
    expect(toggleLikedId(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleLikedId(["a", "b"], "a")).toEqual(["b"]);
    expect(willLikeId(["a"], "b")).toBe(true);
    expect(willLikeId(new Set(["a"]), "a")).toBe(false);
    expect(optimisticLikeUpdate(["a"], "b")).toEqual({ ids: ["a", "b"], willLike: true });
  });

  it("toggles local liked ids without mutating the previous set", () => {
    const a = TrackKey.of(TEST_PROVIDER_ID, "a");
    const b = TrackKey.of(TEST_PROVIDER_ID, "b");
    const previous = new Set([a]);
    const next = toggleLocalLiked(previous, a);
    const added = toggleLocalLiked(previous, b);

    expect([...previous]).toEqual([a]);
    expect([...next]).toEqual([]);
    expect([...added]).toEqual([a, b]);
  });

  it("plans one anonymous-like merge per synced login session", () => {
    const localLiked = new Set([
      TrackKey.of(TEST_PROVIDER_ID, "a"),
      TrackKey.of(OTHER_PROVIDER_ID, "b"),
    ]);

    expect(
      likeSyncMergePlan({
        providerId: TEST_PROVIDER_ID,
        localLiked,
        mergedThisSession: false,
        synced: false,
      }),
    ).toEqual({
      idsToSync: [],
      mergedThisSession: false,
    });
    expect(
      likeSyncMergePlan({
        providerId: TEST_PROVIDER_ID,
        localLiked,
        mergedThisSession: false,
        synced: true,
      }),
    ).toEqual({
      idsToSync: ["a"],
      mergedThisSession: true,
    });
    expect(
      likeSyncMergePlan({
        providerId: TEST_PROVIDER_ID,
        localLiked,
        mergedThisSession: true,
        synced: true,
      }),
    ).toEqual({
      idsToSync: [],
      mergedThisSession: true,
    });
    expect(
      likeSyncMergePlan({
        providerId: TEST_PROVIDER_ID,
        localLiked: new Set(),
        mergedThisSession: false,
        synced: true,
      }),
    ).toEqual({
      idsToSync: [],
      mergedThisSession: true,
    });
    expect([...withoutLikedSource(localLiked, TEST_PROVIDER_ID)]).toEqual([
      TrackKey.of(OTHER_PROVIDER_ID, "b"),
    ]);
  });
});
