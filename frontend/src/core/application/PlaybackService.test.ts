import { describe, expect, it, vi } from "vitest";

import type { MusicProvider, ProviderCapability } from "@domain";
import type { Track, TrackPlayUrl } from "@domain/model/track";

import type { Planet } from "../kernel";
import { PLAY_QUEUE } from "../plugin/playqueue";
import { PlaybackService } from "./PlaybackService";

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void };
function defer<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const track = (id: string): Track => ({
  id,
  playbackId: id,
  name: id,
  durationMs: 1000,
  artists: [],
});

/** Minimal harness: a fake queue capability + a provider stub. play() only ever
 *  touches PLAY_QUEUE and the provider, so nothing else needs resolving. */
function makeService(provider: Partial<MusicProvider>) {
  const playNow = vi.fn<(tracks: readonly Track[], start?: Track) => void>();
  const setShuffle = vi.fn<(enabled: boolean) => void>();
  const queue = { playNow, setShuffle } as unknown;
  const planet = {
    resolve: (cap: unknown) => (cap === PLAY_QUEUE ? queue : null),
  } as unknown as Planet;

  const capabilities = (provider.capabilities ??
    new Set<ProviderCapability>(["fullPlayback"])) as ReadonlySet<ProviderCapability>;
  const full = {
    name: "fake",
    capabilities,
    supports: (cap: ProviderCapability) => capabilities.has(cap),
    playUrls: async (): Promise<TrackPlayUrl[]> => [],
    ...provider,
  } as unknown as MusicProvider;

  return { service: new PlaybackService(planet, () => full), playNow, setShuffle };
}

describe("PlaybackService.play", () => {
  it("exposes the active provider's playback policy from its capabilities", () => {
    const { service } = makeService({
      capabilities: new Set<string>(["previewPlayback"]) as MusicProvider["capabilities"],
    });
    expect(service.playbackPolicy()).toEqual({
      canResolveFullPlayback: false,
      canUsePreviewPlayback: true,
    });
  });

  it("still switches track when play-URL resolution fails (resilient fallback)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { service, playNow } = makeService({
      playUrls: async () => {
        throw new Error("resolve failed");
      },
    });

    await service.play([track("a"), track("b")], track("a"));

    expect(playNow).toHaveBeenCalledTimes(1);
    const [tracks, current] = playNow.mock.calls[0];
    expect(current?.id).toBe("a");
    expect(tracks).toHaveLength(2);
    expect(warn).toHaveBeenCalledTimes(1); // the failure is observable, not swallowed
    warn.mockRestore();
  });

  it("drops a stale play() whose slow resolution lands after a newer one (generation guard)", async () => {
    const deferreds = [defer<TrackPlayUrl[]>(), defer<TrackPlayUrl[]>()];
    let call = 0;
    const { service, playNow } = makeService({
      playUrls: () => deferreds[call++].promise,
    });

    const older = service.play([track("a")], track("a"));
    const newer = service.play([track("b")], track("b"));

    // The newer play resolves first and wins.
    deferreds[1].resolve([]);
    await newer;
    expect(playNow).toHaveBeenCalledTimes(1);
    expect(playNow.mock.calls[0][1]?.id).toBe("b");

    // The older, now-stale resolution lands late and must be discarded.
    deferreds[0].resolve([]);
    await older;
    expect(playNow).toHaveBeenCalledTimes(1);
  });

  it("shufflePlay turns shuffle on before starting; an empty list is a no-op", async () => {
    const { service, playNow, setShuffle } = makeService({});

    await service.shufflePlay([]);
    expect(setShuffle).not.toHaveBeenCalled();
    expect(playNow).not.toHaveBeenCalled();

    await service.shufflePlay([track("a"), track("b")]);
    expect(setShuffle).toHaveBeenCalledWith(true);
    expect(playNow).toHaveBeenCalledTimes(1);
  });
});
