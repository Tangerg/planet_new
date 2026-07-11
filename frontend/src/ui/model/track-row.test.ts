import { describe, expect, it } from "vitest";

import type { VibeTrack } from "./vibe";
import { trackRowModel } from "./track-row";
import { ProviderId } from "@domain/model/provider-id";

const TEST_PROVIDER_ID = ProviderId.of("test");

const source = (overrides: Partial<NonNullable<VibeTrack["source"]>> = {}) => ({
  providerId: TEST_PROVIDER_ID,
  id: "track-1",
  name: "Track",
  durationMs: 180_000,
  artists: [],
  ...overrides,
});

const track = (overrides: Partial<VibeTrack> = {}): VibeTrack => ({
  providerId: TEST_PROVIDER_ID,
  id: "track-1",
  title: "Track",
  name: "Track",
  artist: "Artist",
  coverSeed: 1,
  durSec: 180,
  duration: "3:00",
  ...overrides,
});

describe("track row model", () => {
  it("uses equalizer for the current playing row", () => {
    expect(
      trackRowModel({
        track: track(),
        current: track(),
        playing: true,
        hover: false,
        index: 3,
      }).leading,
    ).toEqual({ kind: "equalizer" });
  });

  it("uses the hover play affordance only when the row is playable", () => {
    expect(
      trackRowModel({
        track: track(),
        playing: false,
        hover: true,
        index: 3,
      }).leading,
    ).toEqual({ kind: "play" });

    expect(
      trackRowModel({
        track: track({ source: source() }),
        playing: false,
        hover: true,
        index: 3,
        policy: { canResolveFullPlayback: true },
      }).leading,
    ).toEqual({ kind: "index", value: 3 });
  });

  it("derives row badges from track facts and availability", () => {
    expect(
      trackRowModel({
        track: track({
          version: "live",
          requiresSubscription: true,
          source: source({ available: false }),
        }),
        playing: false,
        hover: false,
        index: 1,
      }).badges,
    ).toEqual([
      { kind: "version", label: "live" },
      { kind: "subscription", label: "VIP" },
      { kind: "unavailable", label: "Unavailable" },
    ]);

    expect(
      trackRowModel({
        track: track({ version: "studio" }),
        playing: false,
        hover: false,
        index: 1,
      }).badges,
    ).toEqual([]);
  });

  it("uses chart rank and trend when the row belongs to a chart", () => {
    expect(
      trackRowModel({
        track: track(),
        current: track(),
        playing: false,
        hover: true,
        index: 4,
        rank: 2,
        delta: -7,
      }),
    ).toMatchObject({
      chart: true,
      leading: { kind: "rank", value: 2, active: true },
      trend: { kind: "down", value: 7 },
    });

    expect(
      trackRowModel({
        track: track(),
        playing: false,
        hover: false,
        index: 4,
        rank: 2,
      }).trend,
    ).toEqual({ kind: "new" });
  });
});
