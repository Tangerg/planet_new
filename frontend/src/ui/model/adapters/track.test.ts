import { describe, expect, it } from "vitest";

import type { Track } from "@domain/model/track";
import { ProviderId } from "@domain/model/provider-id";

import type { VibeTrack } from "@/model/vibe";
import { toTrack, toVibeTrack } from "./track";

// The UI ↔ domain projection boundary: the adapter is the only writer of
// `source`, and `toTrack()` is the only reader that recovers it for playback.
const domainTrack: Track = {
  providerId: ProviderId.of("test"),
  id: "t1",
  name: "Song",
  durationMs: 200_000,
  artists: [{ providerId: ProviderId.of("test"), id: "a1", name: "Artist" }],
  album: { providerId: ProviderId.of("test"), id: "al1", name: "Album", images: [] },
  playUrl: "http://cdn/1.mp3",
};

describe("track projection boundary", () => {
  it("projects the domain track in and carries it as source", () => {
    expect(toVibeTrack(domainTrack).source).toBe(domainTrack);
  });

  it("recovers the exact same domain track on the round trip (no re-synthesis)", () => {
    expect(toTrack(toVibeTrack(domainTrack))).toBe(domainTrack);
  });

  it("does not turn a source-less placeholder into a fake domain track", () => {
    const placeholder: VibeTrack = {
      id: "",
      title: "Not playing",
      name: "Not playing",
      artist: "",
      coverSeed: 0,
      durSec: 0,
      duration: "0:00",
    };
    expect(() => toTrack(placeholder)).toThrow(/provider identity/);
  });

  it("can recover a view-only track when its provider namespace is explicit", () => {
    const track: VibeTrack = {
      providerId: ProviderId.of("test"),
      id: "t2",
      title: "View-only",
      name: "View-only",
      artist: "Artist",
      artistId: "a2",
      coverSeed: 0,
      durSec: 90,
      duration: "1:30",
    };
    expect(toTrack(track)).toMatchObject({
      providerId: ProviderId.of("test"),
      id: "t2",
      durationMs: 90_000,
      artists: [{ providerId: ProviderId.of("test"), id: "a2" }],
    });
  });
});
