import { describe, expect, it } from "vitest";

import {
  likesAreAccountBacked,
  likesToMerge,
  likedSetForSource,
  optimisticLikeUpdate,
  toggleLikedId,
  toggleLocalLiked,
  withoutLikedIds,
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

  it("owes the account this provider's anonymous likes, once per login session", () => {
    const localLiked = new Set([
      TrackKey.of(TEST_PROVIDER_ID, "a"),
      TrackKey.of(OTHER_PROVIDER_ID, "b"),
    ]);
    const plan = (over: { alreadyMerged?: boolean; synced?: boolean }) =>
      likesToMerge({
        providerId: TEST_PROVIDER_ID,
        localLiked,
        alreadyMerged: false,
        synced: true,
        ...over,
      });

    expect(plan({})).toEqual(["a"]); // another source's like is not this account's
    expect(plan({ synced: false })).toEqual([]);
    expect(plan({ alreadyMerged: true })).toEqual([]);
  });

  it("retires only the likes the account accepted, so a failed push keeps its like", () => {
    const localLiked = new Set([
      TrackKey.of(TEST_PROVIDER_ID, "landed"),
      TrackKey.of(TEST_PROVIDER_ID, "rejected"),
      TrackKey.of(OTHER_PROVIDER_ID, "landed"),
    ]);

    expect([...withoutLikedIds(localLiked, TEST_PROVIDER_ID, ["landed"])]).toEqual([
      TrackKey.of(TEST_PROVIDER_ID, "rejected"),
      TrackKey.of(OTHER_PROVIDER_ID, "landed"),
    ]);
    expect([...withoutLikedIds(localLiked, TEST_PROVIDER_ID, [])]).toEqual([...localLiked]);
  });
});
