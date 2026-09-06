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
        index: 3,
      }).leading,
    ).toEqual({ kind: "equalizer" });
  });

  it("numbers every other row, leaving the play affordance to the row's :hover", () => {
    expect(trackRowModel({ track: track(), playing: false, index: 3 }).leading).toEqual({
      kind: "index",
      value: 3,
    });
  });

  it("marks an unresolvable row unavailable so the row can withhold its affordances", () => {
    expect(
      trackRowModel({
        track: track({ source: source() }),
        playing: false,
        index: 3,
        policy: { canResolveFullPlayback: true },
      }),
    ).toMatchObject({ unavailable: true, leading: { kind: "index", value: 3 } });

    expect(trackRowModel({ track: track(), playing: false, index: 3 }).unavailable).toBe(false);
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
        index: 1,
      }).badges,
    ).toEqual([
      // Provider content and the tier mark stay verbatim; only our own copy is keyed.
      { kind: "version", label: { text: "live" } },
      { kind: "subscription", label: { text: "VIP" } },
      { kind: "unavailable", label: { key: "player.unavailable" } },
    ]);

    expect(
      trackRowModel({
        track: track({ version: "studio" }),
        playing: false,
        index: 1,
      }).badges,
    ).toEqual([]);
  });

  it("shows the chart rank instead of the list index when the row is ranked", () => {
    expect(
      trackRowModel({
        track: track(),
        current: track(),
        playing: false,
        index: 4,
        rank: 2,
      }),
    ).toMatchObject({
      chart: true,
      leading: { kind: "rank", value: 2, active: true },
    });
  });
});
