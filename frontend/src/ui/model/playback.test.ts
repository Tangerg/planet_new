import { describe, expect, it } from "vitest";

import type { Track } from "@domain/model/track";

import { toVibeTrack } from "@/model/adapters/track";
import type { VibeTrack } from "./vibe";
import {
  currentTrackView,
  playbackCommandQueue,
  playbackCommandTarget,
  playbackQueueView,
  queueCommandTrack,
  shufflePlaybackCommandQueue,
  upNextView,
} from "./playback";

const domainTrack = (id: string): Track => ({
  id,
  name: id,
  durationMs: 180_000,
  trackNumber: 1,
  discNumber: 1,
  explicit: false,
  artists: [{ id: `artist-${id}`, name: "Artist" }],
});

const viewTrack = (id: string): VibeTrack => ({
  id,
  title: id,
  name: id,
  artist: "Artist",
  coverSeed: 1,
  durSec: 180,
  duration: "3:00",
});

describe("playback model", () => {
  it("projects domain queue reads into Vibe tracks", () => {
    const first = domainTrack("a");
    const second = domainTrack("b");

    expect(currentTrackView(first)).toMatchObject({ id: "a", source: first });
    expect(currentTrackView(undefined)).toBeUndefined();
    expect(playbackQueueView([first, second]).map((track) => track.id)).toEqual(["a", "b"]);
    expect(playbackQueueView(undefined)).toEqual([]);
  });

  it("derives up-next tracks from the domain queue", () => {
    const first = domainTrack("a");
    const second = domainTrack("b");
    const third = domainTrack("c");

    expect(upNextView([first, second, third], second).map((track) => track.id)).toEqual(["c"]);
    expect(upNextView(undefined, second)).toEqual([]);
  });

  it("builds playback commands from the active context when available", () => {
    const first = domainTrack("a");
    const second = domainTrack("b");
    const viewFirst = toVibeTrack(first);
    const viewSecond = toVibeTrack(second);

    expect(playbackCommandQueue([viewFirst, viewSecond], viewSecond)).toEqual([first, second]);
    expect(playbackCommandTarget(viewSecond)).toBe(second);
  });

  it("falls back to the selected track when context is empty", () => {
    const selected = toVibeTrack(domainTrack("selected"));

    expect(playbackCommandQueue([], selected)).toEqual([selected.source]);
    expect(playbackCommandQueue(undefined, selected)).toEqual([selected.source]);
  });

  it("maps shuffle and queue commands through the same projection boundary", () => {
    const first = domainTrack("a");
    const second = domainTrack("b");

    expect(shufflePlaybackCommandQueue([toVibeTrack(first), toVibeTrack(second)])).toEqual([
      first,
      second,
    ]);

    const synthetic = viewTrack("synthetic");
    expect(queueCommandTrack(synthetic)).toMatchObject({ id: "synthetic", name: "synthetic" });
  });
});
