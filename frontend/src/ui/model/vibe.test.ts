import { describe, expect, it } from "vitest";

import { ProviderId } from "@contexts/contracts";
import { sameVibeTrack, seedOf, vibeTrackKey } from "./vibe";

const netease = ProviderId.of("netease");
const qq = ProviderId.of("qq");

describe("seedOf", () => {
  it("maps an id to a stable non-negative integer", () => {
    expect(seedOf("track-1")).toBe(seedOf("track-1"));
    const seed = seedOf("track-1");
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
  });

  it("coerces undefined and numbers through their string form", () => {
    expect(seedOf(undefined)).toBe(seedOf(""));
    expect(seedOf(42)).toBe(seedOf("42"));
  });

  it("separates distinct ids", () => {
    expect(seedOf("a")).not.toBe(seedOf("b"));
  });
});

describe("vibeTrackKey", () => {
  it("forms a key only when both a provider and an id are present", () => {
    expect(vibeTrackKey({ providerId: netease, id: "1" })).toBeDefined();
    expect(vibeTrackKey({ providerId: netease, id: "" })).toBeUndefined();
    expect(vibeTrackKey({ id: "1" })).toBeUndefined();
    expect(vibeTrackKey(null)).toBeUndefined();
  });

  it("namespaces the bare id by its provider", () => {
    expect(vibeTrackKey({ providerId: netease, id: "1" })).not.toBe(
      vibeTrackKey({ providerId: qq, id: "1" }),
    );
  });
});

describe("sameVibeTrack", () => {
  it("matches only when both sides share a source-qualified key", () => {
    const track = { providerId: netease, id: "1" };
    expect(sameVibeTrack(track, { providerId: netease, id: "1" })).toBe(true);
    // Same bare id, different source — must NOT collide.
    expect(sameVibeTrack(track, { providerId: qq, id: "1" })).toBe(false);
    expect(sameVibeTrack(track, { providerId: netease, id: "2" })).toBe(false);
  });

  it("never matches keyless placeholders, not even against each other", () => {
    expect(sameVibeTrack({ id: "1" }, { id: "1" })).toBe(false);
    expect(sameVibeTrack(null, null)).toBe(false);
  });
});
