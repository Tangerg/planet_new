import { describe, expect, it } from "vitest";

import type { Track } from "@domain/model/track";

import type { VibeTrack } from "@/model/vibe";
import { toTrack, toVibeTrack } from "./track";

// The UI ↔ domain projection boundary: the adapter is the only writer of
// `source`, and `toTrack()` is the only reader that recovers it for playback.
const domainTrack: Partial<Track> = {
  id: "t1",
  name: "Song",
  durationMs: 200_000,
  artists: [{ id: "a1", name: "Artist" }],
  album: { id: "al1", name: "Album", images: [] },
  playUrl: "http://cdn/1.mp3",
};

describe("track projection boundary", () => {
  it("projects the domain track in and carries it as source", () => {
    expect(toVibeTrack(domainTrack).source).toBe(domainTrack);
  });

  it("recovers the exact same domain track on the round trip (no re-synthesis)", () => {
    expect(toTrack(toVibeTrack(domainTrack))).toBe(domainTrack);
  });

  it("synthesises a minimal track for source-less view tracks (e.g. the placeholder)", () => {
    const placeholder: VibeTrack = {
      id: "",
      title: "Not playing",
      name: "Not playing",
      artist: "",
      coverSeed: 0,
      durSec: 0,
      duration: "0:00",
    };
    const recovered = toTrack(placeholder);
    expect(recovered).not.toBe(placeholder);
    expect(recovered).toMatchObject({ id: "", name: "Not playing", durationMs: 0, artists: [] });
  });
});
