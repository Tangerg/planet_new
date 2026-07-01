import { describe, expect, it } from "vitest";

import { PlaybackIntent } from "./playback-intent";
import type { Track } from "./track";

const track = (id: string): Track => ({ id, name: id, durationMs: 1000, artists: [] });

describe("PlaybackIntent", () => {
  it("falls back to a single requested track when no queue is provided", () => {
    const t1 = track("1");
    const intent = PlaybackIntent.from([], t1);

    expect(intent.tracks).toEqual([t1]);
    expect(intent.trackIds).toEqual(["1"]);
  });

  it("requests each track play URL at most once", () => {
    const t1 = track("1");
    const duplicate = track("1");
    const t2 = track("2");
    const intent = PlaybackIntent.from([t1, duplicate, t2], t1);

    expect(intent.trackIds).toEqual(["1", "2"]);
  });

  it("resolves play URLs without mutating the source tracks", () => {
    const t1 = track("1");
    const t2 = track("2");
    const intent = PlaybackIntent.from([t1, t2], t2);

    const resolved = intent.withResolvedUrls([{ id: "2", playUrl: "https://cdn.example/2.mp3" }]);

    expect(t2.playUrl).toBeUndefined();
    expect(resolved.current).toMatchObject({ id: "2", playUrl: "https://cdn.example/2.mp3" });
    expect(resolved.tracks.map((t) => t.id)).toEqual(["1", "2"]);
  });

  it("keeps the first resolved track current when the requested track is absent", () => {
    const intent = PlaybackIntent.from([track("1"), track("2")], track("missing"));

    expect(intent.withResolvedUrls([]).current.id).toBe("1");
  });
});
