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
