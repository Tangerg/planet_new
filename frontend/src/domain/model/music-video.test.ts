import { describe, expect, test } from "vitest";
import { MusicVideo } from "./music-video";

describe("MusicVideo", () => {
  test("exposes artist credit behavior", () => {
    const mv = {
      artists: [
        { id: "artist-1", name: "Lin Junjie" },
        { id: "artist-2", name: "Faye Wong" },
      ],
    };

    expect(MusicVideo.primaryArtist(mv)?.id).toBe("artist-1");
    expect(MusicVideo.artistNames(mv)).toBe("Lin Junjie, Faye Wong");
    expect(MusicVideo.artistCredits(mv)).toEqual([
      { id: "artist-1", name: "Lin Junjie" },
      { id: "artist-2", name: "Faye Wong" },
    ]);
  });

  test("formats streaming playback metadata", () => {
    expect(MusicVideo.durationSeconds({ durationMs: 245_000 })).toBe(245);
    expect(MusicVideo.durationFormatted({ durationMs: 245_000 })).toBe("04:05");
    expect(MusicVideo.isPlayable({ playUrl: "https://example.com/video.mp4" })).toBe(true);
    expect(MusicVideo.isPlayable({})).toBe(false);
  });

  test("describes MV playback availability separately from track playback", () => {
    expect(MusicVideo.playbackAvailability({ id: "mv1" })).toEqual({
      status: "unavailable",
      canStart: false,
      reason: "provider-unsupported",
    });
    expect(MusicVideo.playbackAvailability({ id: "mv1" }, { canResolvePlayback: true })).toEqual({
      status: "resolvable",
      canStart: true,
    });
    expect(
      MusicVideo.playbackAvailability(
        { id: "mv1", playbackResolved: true },
        { canResolvePlayback: true },
      ),
    ).toEqual({ status: "unavailable", canStart: false, reason: "missing-url" });
    expect(
      MusicVideo.playbackAvailability(
        { id: "mv1", available: false },
        { canResolvePlayback: true },
      ),
    ).toEqual({ status: "unavailable", canStart: false, reason: "not-available" });
  });

  test("keeps unique music videos by provider id", () => {
    expect(
      MusicVideo.uniqueById([
        { id: "1", name: "first" },
        { id: "", name: "missing" },
        { name: "also missing" },
        { id: "2", name: "second" },
        { id: "1", name: "duplicate" },
      ]),
    ).toEqual([
      { id: "1", name: "first" },
      { id: "2", name: "second" },
    ]);
  });
});
