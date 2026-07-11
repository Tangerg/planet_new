import { describe, expect, it } from "vitest";

import { PlaybackIntent } from "./playback-intent";
import type { Track } from "./track";
import { ProviderId } from "./provider-id";

const TEST_PROVIDER_ID = ProviderId.of("test");
const OTHER_PROVIDER_ID = ProviderId.of("other");

const track = (id: string, playbackId = id, providerId = TEST_PROVIDER_ID): Track => ({
  providerId,
  id,
  playbackId,
  name: id,
  durationMs: 1000,
  artists: [],
});

describe("PlaybackIntent", () => {
  it("falls back to a single requested track when no queue is provided", () => {
    const t1 = track("1");
    const intent = PlaybackIntent.from([], t1);

    expect(intent.tracks).toEqual([t1]);
    expect(intent.trackIds).toEqual(["1"]);
    expect(intent.playbackIds).toEqual(["1"]);
  });

  it("requests each track play URL at most once", () => {
    const t1 = track("1");
    const duplicate = track("duplicate-row", "1");
    const t2 = track("2");
    const intent = PlaybackIntent.from([t1, duplicate, t2], t1);

    expect(intent.trackIds).toEqual(["1", "duplicate-row", "2"]);
    expect(intent.playbackIds).toEqual(["1", "2"]);
  });

  it("requests only tracks that need provider URL resolution", () => {
    const ready = { ...track("ready"), playUrl: "https://cdn.example/ready.mp3" };
    const duplicateResolvable = track("missing");
    const preview = { ...track("preview"), previewUrl: "https://cdn.example/preview.mp3" };
    const intent = PlaybackIntent.from(
      [ready, track("missing"), duplicateResolvable, preview],
      ready,
    );

    expect(intent.playbackIdsToResolve(TEST_PROVIDER_ID, { canResolveFullPlayback: true })).toEqual(
      ["missing", "preview"],
    );
    expect(
      intent.playbackIdsToResolve(TEST_PROVIDER_ID, { canResolveFullPlayback: false }),
    ).toEqual([]);
  });

  it("resolves play URLs without mutating the source tracks", () => {
    const t1 = track("1");
    const t2 = track("2");
    const intent = PlaybackIntent.from([t1, t2], t2);

    const resolved = intent.withResolvedUrls([
      {
        providerId: TEST_PROVIDER_ID,
        urls: [{ playbackId: "2", playUrl: "https://cdn.example/2.mp3" }],
      },
    ]);

    expect(t2.playUrl).toBeUndefined();
    expect(resolved.current).toMatchObject({ id: "2", playUrl: "https://cdn.example/2.mp3" });
    expect(resolved.tracks.map((t) => t.id)).toEqual(["1", "2"]);
  });

  it("keeps the first resolved track current when the requested track is absent", () => {
    const intent = PlaybackIntent.from([track("1"), track("2")], track("missing"));

    expect(intent.withResolvedUrls([]).current.id).toBe("1");
  });

  it("matches current and resolved URLs by source-qualified identity", () => {
    const test = track("same", "same", TEST_PROVIDER_ID);
    const other = track("same", "same", OTHER_PROVIDER_ID);
    const resolved = PlaybackIntent.from([test, other], other).withResolvedUrls([
      {
        providerId: TEST_PROVIDER_ID,
        urls: [{ playbackId: "same", playUrl: "test://same" }],
      },
      {
        providerId: OTHER_PROVIDER_ID,
        urls: [{ playbackId: "same", playUrl: "other://same" }],
      },
    ]);

    expect(resolved.current.providerId).toBe(OTHER_PROVIDER_ID);
    expect(resolved.tracks.map((item) => item.playUrl)).toEqual(["test://same", "other://same"]);
  });
});
