import { describe, expect, test } from "vitest";
import { Track } from "./track";
import { ProviderId } from "./provider-id";

const TEST_PROVIDER_ID = ProviderId.of("test");

/** A whole track, since the companion takes whole tracks — each case overrides
 *  only the fields it is actually about. */
const track = (overrides: Partial<Track> = {}): Track => ({
  providerId: TEST_PROVIDER_ID,
  id: "1",
  name: "Track",
  durationMs: 0,
  artists: [],
  ...overrides,
});

describe("Track", () => {
  test("uses track artist credits before album artist credits", () => {
    const value = track({
      artists: [{ providerId: TEST_PROVIDER_ID, id: "track-artist", name: "Track Artist" }],
      album: {
        providerId: TEST_PROVIDER_ID,
        artists: [{ providerId: TEST_PROVIDER_ID, id: "album-artist", name: "Album Artist" }],
      },
    });

    expect(Track.primaryArtist(value)?.id).toBe("track-artist");
    expect(Track.artistNames(value)).toBe("Track Artist");
    expect(Track.artistCredits(value)).toEqual([{ id: "track-artist", name: "Track Artist" }]);
  });

  test("falls back to album credits when list payloads omit named track artists", () => {
    const value = track({
      artists: [{ providerId: TEST_PROVIDER_ID, id: "empty", name: " " }],
      album: {
        providerId: TEST_PROVIDER_ID,
        artists: [{ providerId: TEST_PROVIDER_ID, id: "album-artist", name: "Album Artist" }],
      },
    });

    expect(Track.primaryArtist(value)?.id).toBe("album-artist");
    expect(Track.artistNames(value)).toBe("Album Artist");
    expect(Track.artistCredits(value)).toEqual([{ id: "album-artist", name: "Album Artist" }]);
  });

  test("applies resolved provider playback URLs without mutating tracks", () => {
    const original = {
      providerId: TEST_PROVIDER_ID,
      id: "1",
      playbackId: "mid-1",
      name: "Song",
      durationMs: 1,
      artists: [],
    };
    const untouched = {
      providerId: TEST_PROVIDER_ID,
      id: "2",
      playbackId: "mid-2",
      name: "Other",
      durationMs: 1,
      artists: [],
      playUrl: "old",
    };

    const resolved = Track.withResolvedPlayUrls(
      [original, untouched],
      [
        {
          providerId: TEST_PROVIDER_ID,
          urls: [{ playbackId: "mid-1", playUrl: "https://stream.example/song.mp3" }],
        },
      ],
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
        track({ id: "1", name: "A" }),
        track({ id: "", name: "empty" }),
        track({ id: "2", name: "B" }),
        track({ id: "  ", name: "blank" }),
        track({ id: "1", name: "duplicate" }),
      ]),
    ).toEqual(["1", "2"]);
  });

  test("keeps unique playback lookup ids separate from identity ids", () => {
    expect(
      Track.uniquePlaybackIds([
        track({ id: "chart-row-1", playbackId: "songmid-1" }),
        track({ id: "chart-row-2" }),
        track({ id: "chart-row-3", playbackId: "songmid-2" }),
        track({ id: "chart-row-4", playbackId: "songmid-1" }),
      ]),
    ).toEqual(["songmid-1", "songmid-2"]);
  });

  test("describes playback availability with provider URL resolution", () => {
    expect(Track.playbackAvailability(track({ id: "1" }))).toMatchObject({
      status: "unavailable",
      reason: "provider-unsupported",
    });
    expect(
      Track.playbackAvailability(track({ id: "display-row", playbackId: "provider-songmid" }), {
        canResolveFullPlayback: true,
      }),
    ).toEqual({ status: "resolvable", canStart: true });
    expect(
      Track.isPlayable(track({ id: "display-row", playbackId: "provider-songmid" }), {
        canResolveFullPlayback: true,
      }),
    ).toBe(true);
    expect(
      Track.playbackAvailability(track({ id: "1" }), { canResolveFullPlayback: true }),
    ).toEqual({
      status: "unavailable",
      canStart: false,
      reason: "missing-playback-id",
    });
  });

  test("treats an unlicensed track as unavailable regardless of policy", () => {
    expect(Track.playbackAvailability(track({ id: "1", available: false }))).toEqual({
      status: "unavailable",
      canStart: false,
      reason: "not-available",
    });
    expect(
      Track.isUnavailable(track({ id: "1", available: false }), { canResolveFullPlayback: true }),
    ).toBe(true);
  });

  test("marks a track unavailable only when the provider can play but this track can't", () => {
    const full = { canResolveFullPlayback: true };
    const previewOnly = { canUsePreviewPlayback: true };

    // Full-playback provider (NCM/QQ): any id resolves → never unavailable.
    expect(Track.isUnavailable(track({ id: "1", playbackId: "1" }), full)).toBe(false);
    expect(Track.isUnavailable(track({ id: "1" }), full)).toBe(true);
    // Preview-only provider (Spotify): with a preview clip it plays, without it can't.
    expect(Track.isUnavailable(track({ id: "1", previewUrl: "clip" }), previewOnly)).toBe(false);
    expect(Track.isUnavailable(track({ id: "1" }), previewOnly)).toBe(true);
    // A provider with no playback capability at all: rows stay interactive.
    expect(Track.isUnavailable(track({ id: "1" }), {})).toBe(false);
    expect(Track.isUnavailable(track({ id: "1" }))).toBe(false);
  });
});
