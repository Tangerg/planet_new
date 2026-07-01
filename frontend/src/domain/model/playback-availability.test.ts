import { describe, expect, test } from "vitest";

import { PlaybackAvailability } from "./playback-availability";

describe("PlaybackAvailability", () => {
  test("treats full stream URLs as ready", () => {
    expect(
      PlaybackAvailability.fromTrack({ id: "1", playUrl: "https://cdn.example/1.mp3" }),
    ).toEqual({ status: "ready", canStart: true });
  });

  test("marks provider-resolvable tracks separately from ready tracks", () => {
    expect(PlaybackAvailability.fromTrack({ id: "1" }, { canResolveFullPlayback: true })).toEqual({
      status: "resolvable",
      canStart: true,
    });
  });

  test("allows preview playback when a preview URL exists", () => {
    expect(
      PlaybackAvailability.fromTrack({ id: "1", previewUrl: "https://p.example/1.mp3" }),
    ).toEqual({ status: "preview", canStart: true });
  });

  test("explains why a track cannot start", () => {
    expect(PlaybackAvailability.fromTrack({ id: "1" })).toEqual({
      status: "unavailable",
      canStart: false,
      reason: "provider-unsupported",
    });
    expect(PlaybackAvailability.fromTrack({})).toEqual({
      status: "unavailable",
      canStart: false,
      reason: "missing-track-id",
    });
  });
});
