import { describe, expect, test } from "vitest";
import { Track } from "./track";

describe("Track", () => {
  test("uses track artist credits before album artist credits", () => {
    const track = {
      artists: [{ id: "track-artist", name: "Track Artist" }],
      album: { artists: [{ id: "album-artist", name: "Album Artist" }] },
    };

    expect(Track.primaryArtist(track)?.id).toBe("track-artist");
    expect(Track.artistNames(track)).toBe("Track Artist");
    expect(Track.artistCredits(track)).toEqual([{ id: "track-artist", name: "Track Artist" }]);
  });

  test("falls back to album credits when list payloads omit named track artists", () => {
    const track = {
      artists: [{ id: "empty", name: " " }],
      album: { artists: [{ id: "album-artist", name: "Album Artist" }] },
    };

    expect(Track.primaryArtist(track)?.id).toBe("album-artist");
    expect(Track.artistNames(track)).toBe("Album Artist");
    expect(Track.artistCredits(track)).toEqual([{ id: "album-artist", name: "Album Artist" }]);
  });

  test("applies resolved provider playback URLs without mutating tracks", () => {
    const original = { id: "1", name: "Song", durationMs: 1, artists: [] };
    const untouched = { id: "2", name: "Other", durationMs: 1, artists: [], playUrl: "old" };

    const resolved = Track.withResolvedPlayUrls(
      [original, untouched],
      [{ id: "1", playUrl: "https://stream.example/song.mp3" }],
    );

    expect(resolved).toEqual([
      { ...original, playUrl: "https://stream.example/song.mp3" },
      untouched,
    ]);
    expect(resolved[0]).not.toBe(original);
    expect(resolved[1]).not.toBe(untouched);
    expect(original).not.toHaveProperty("playUrl");
  });

  test("keeps unique provider lookup ids in encounter order", () => {
    expect(
      Track.uniqueIds([
        { id: "1", name: "A" },
        { id: "", name: "empty" },
        { id: "2", name: "B" },
        { name: "missing" },
        { id: "1", name: "duplicate" },
      ]),
    ).toEqual(["1", "2"]);
  });

  test("describes playback availability with provider URL resolution", () => {
    expect(Track.playbackAvailability({ id: "1" })).toMatchObject({
      status: "unavailable",
      reason: "provider-unsupported",
    });
    expect(Track.playbackAvailability({ id: "1" }, { canResolveFullPlayback: true })).toEqual({
      status: "resolvable",
      canStart: true,
    });
    expect(Track.isPlayable({ id: "1" }, { canResolveFullPlayback: true })).toBe(true);
  });
});
