import { describe, expect, it, vi } from "vitest";

import { ProviderId, type PlaybackResolver } from "@domain";
import type { Track } from "@domain/model/track";

import type { Planet } from "../kernel";
import { PLAY_QUEUE } from "../plugin/playqueue";
import { PlaybackService } from "./PlaybackService";

const TEST_PROVIDER_ID = ProviderId.of("test");

const track = (id: string, providerId = TEST_PROVIDER_ID): Track => ({
  providerId,
  id,
  playbackId: id,
  name: id,
  durationMs: 1000,
  artists: [],
});

/** Minimal harness: a fake queue capability + a resolver stub for playbackPolicy().
 *  play() is a thin command that only touches PLAY_QUEUE — URL resolution is done
 *  just-in-time by the playback plugin, not here. */
function makeService(policy?: PlaybackResolver["policy"]) {
  const playNow = vi.fn<(tracks: readonly Track[], start?: Track) => void>();
  const setShuffle = vi.fn<(enabled: boolean) => void>();
  const addNext = vi.fn<(track: Track) => void>();
  const clear = vi.fn<() => void>();
  const next = vi.fn<() => void>();
  const queue = { playNow, setShuffle, addNext, clear, next } as unknown;
  const planet = {
    resolve: (cap: unknown) => (cap === PLAY_QUEUE ? queue : null),
  } as unknown as Planet;
  const active: PlaybackResolver = {
    providerId: TEST_PROVIDER_ID,
    diagnosticName: "fake",
    policy: policy ?? { canResolveFullPlayback: true, canUsePreviewPlayback: false },
    resolve: async () => [],
  };
  return {
    service: new PlaybackService(planet, { active: () => active, get: () => active }),
    playNow,
    setShuffle,
    addNext,
    clear,
    next,
  };
}

describe("PlaybackService", () => {
  it("exposes the active resolver's playback policy", () => {
    const { service } = makeService({ canResolveFullPlayback: false, canUsePreviewPlayback: true });
    expect(service.playbackPolicy()).toEqual({
      canResolveFullPlayback: false,
      canUsePreviewPlayback: true,
    });
  });

  it("play() queues the tracks as-is; URLs are resolved just-in-time by the plugin", () => {
    const { service, playNow } = makeService();
    const tracks = [track("a"), track("b")];

    service.play(tracks, tracks[0]);

    expect(playNow).toHaveBeenCalledTimes(1);
    const [queued, current] = playNow.mock.calls[0];
    expect(queued).toBe(tracks);
    expect(current?.id).toBe("a");
    // No play URL is written up front — the queue must stay stale-URL-free.
    expect(queued.every((t) => t.playUrl === undefined)).toBe(true);
  });

  it("shufflePlay turns shuffle on before starting; an empty list is a no-op", () => {
    const { service, playNow, setShuffle } = makeService();

    service.shufflePlay([]);
    expect(setShuffle).not.toHaveBeenCalled();
    expect(playNow).not.toHaveBeenCalled();

    service.shufflePlay([track("a"), track("b")]);
    expect(setShuffle).toHaveBeenCalledWith(true);
    expect(playNow).toHaveBeenCalledTimes(1);
  });

  it("routes play-next queue edits through the queue capability", () => {
    const { service, addNext } = makeService();
    const queued = track("next");

    service.addNextToQueue(queued);

    expect(addNext).toHaveBeenCalledWith(queued);
  });

  it("next() advances the queue", () => {
    const { service, next } = makeService();
    service.next();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
