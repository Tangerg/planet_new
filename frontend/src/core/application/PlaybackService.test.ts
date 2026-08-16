import { describe, expect, it, vi } from "vitest";

import { ProviderId, type PlaybackResolver } from "@domain";
import type { Track, TrackPlayUrl } from "@domain/model/track";

import type { Host } from "dougong";
import { PLAY_QUEUE } from "../plugin/playqueue";
import { PlaybackResolutionError, PlaybackService } from "./PlaybackService";

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void };
function defer<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const TEST_PROVIDER_ID = ProviderId.of("test");

const track = (id: string, providerId = TEST_PROVIDER_ID): Track => ({
  providerId,
  id,
  playbackId: id,
  name: id,
  durationMs: 1000,
  artists: [],
});

/** Minimal harness: a fake queue Service + a provider stub. play() only ever
 *  touches PLAY_QUEUE and the provider, so nothing else needs resolving. */
function makeService(
  resolver: Partial<PlaybackResolver>,
  additionalResolvers: Partial<PlaybackResolver>[] = [],
) {
  const playNow = vi.fn<(tracks: readonly Track[], start?: Track) => void>();
  const setShuffle = vi.fn<(enabled: boolean) => void>();
  const addNext = vi.fn<(track: Track) => void>();
  const clear = vi.fn<() => void>();
  const queue = { playNow, setShuffle, addNext, clear } as unknown;
  const host = {
    get: (token: unknown) => {
      if (token !== PLAY_QUEUE) throw new Error("unexpected Service lookup");
      return queue;
    },
  } as unknown as Host;

  const complete = (partial: Partial<PlaybackResolver>, index: number): PlaybackResolver => {
    return {
      providerId: index === 0 ? TEST_PROVIDER_ID : ProviderId.of(`source-${index}`),
      diagnosticName: `fake-${index}`,
      policy: { canResolveFullPlayback: true, canUsePreviewPlayback: false },
      resolve: async (): Promise<TrackPlayUrl[]> => [],
      ...partial,
    };
  };
  const active = complete(resolver, 0);
  const resolvers = [active, ...additionalResolvers.map(complete)];

  return {
    service: new PlaybackService(host, {
      active: () => active,
      get: (providerId) =>
        resolvers.find((candidate) => candidate.providerId === providerId) ?? null,
    }),
    playNow,
    setShuffle,
    addNext,
    clear,
  };
}

describe("PlaybackService.play", () => {
  it("exposes the active resolver's playback policy", () => {
    const { service } = makeService({
      policy: { canResolveFullPlayback: false, canUsePreviewPlayback: true },
    });
    expect(service.playbackPolicy()).toEqual({
      canResolveFullPlayback: false,
      canUsePreviewPlayback: true,
    });
  });

  it("still switches track when play-URL resolution fails (resilient fallback)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cause = new Error("resolve failed");
    const { service, playNow } = makeService({
      resolve: async () => {
        throw cause;
      },
    });

    const outcome = await service.play([track("a"), track("b")], track("a"));

    expect(playNow).toHaveBeenCalledTimes(1);
    const [tracks, current] = playNow.mock.calls[0];
    expect(current?.id).toBe("a");
    expect(tracks).toHaveLength(2);
    expect(warn).toHaveBeenCalledTimes(1); // the failure is observable, not swallowed
    expect(outcome).toMatchObject({
      status: "started",
      resolutions: [{ status: "failed", providerId: TEST_PROVIDER_ID }],
    });
    if (outcome.status !== "started" || outcome.resolutions[0]?.status !== "failed") {
      throw new Error("expected a failed provider resolution");
    }
    expect(outcome.resolutions[0].error).toBeInstanceOf(PlaybackResolutionError);
    expect(outcome.resolutions[0].error.cause).toBe(cause);
    warn.mockRestore();
  });

  it("reports complete, partial and unresolved provider reads without conflating them", async () => {
    const complete = makeService({
      resolve: async (ids) =>
        ids.map((playbackId) => ({ playbackId, playUrl: `test://${playbackId}` })),
    });
    await expect(
      complete.service.play([track("a"), track("b")], track("a")),
    ).resolves.toMatchObject({
      status: "started",
      resolutions: [{ status: "resolved", requested: 2, resolved: 2 }],
    });

    const partial = makeService({
      resolve: async () => [
        { playbackId: "a", playUrl: "test://a" },
        { playbackId: "a", playUrl: "test://a-duplicate" },
        { playbackId: "b", playUrl: "" },
        { playbackId: "not-requested", playUrl: "test://other" },
      ],
    });
    await expect(partial.service.play([track("a"), track("b")], track("a"))).resolves.toMatchObject(
      {
        status: "started",
        resolutions: [{ status: "partial", requested: 2, resolved: 1 }],
      },
    );

    const unresolved = makeService({
      resolve: async () => [{ playbackId: "not-requested", playUrl: "test://other" }],
    });
    await expect(
      unresolved.service.play([track("a"), track("b")], track("a")),
    ).resolves.toMatchObject({
      status: "started",
      resolutions: [{ status: "unresolved", requested: 2, resolved: 0 }],
    });
  });

  it("reports when resolution was unnecessary or its owning source disappeared", async () => {
    const resolve = vi.fn<PlaybackResolver["resolve"]>(async () => []);
    const ready = { ...track("ready"), playUrl: "test://ready" };
    const available = makeService({ resolve });
    await expect(available.service.play([ready], ready)).resolves.toMatchObject({
      status: "started",
      resolutions: [{ status: "notRequired", providerId: TEST_PROVIDER_ID }],
    });
    expect(resolve).not.toHaveBeenCalled();

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const missingProviderId = ProviderId.of("missing");
    const missing = track("gone", missingProviderId);
    await expect(available.service.play([missing], missing)).resolves.toMatchObject({
      status: "started",
      resolutions: [{ status: "sourceUnavailable", providerId: missingProviderId }],
    });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("drops a stale play() whose slow resolution lands after a newer one (generation guard)", async () => {
    const deferreds = [defer<TrackPlayUrl[]>(), defer<TrackPlayUrl[]>()];
    let call = 0;
    const { service, playNow } = makeService({
      resolve: () => deferreds[call++].promise,
    });

    const older = service.play([track("a")], track("a"));
    const newer = service.play([track("b")], track("b"));

    // The newer play resolves first and wins.
    deferreds[1].resolve([]);
    await expect(newer).resolves.toMatchObject({ status: "started" });
    expect(playNow).toHaveBeenCalledTimes(1);
    expect(playNow.mock.calls[0][1]?.id).toBe("b");

    // The older, now-stale resolution lands late and must be discarded.
    deferreds[0].resolve([]);
    await expect(older).resolves.toMatchObject({ status: "superseded" });
    expect(playNow).toHaveBeenCalledTimes(1);
  });

  it("drops a stale resolution across a rapid provider switch", async () => {
    const activePending = defer<TrackPlayUrl[]>();
    const otherPending = defer<TrackPlayUrl[]>();
    const otherId = ProviderId.of("other");
    const { service, playNow } = makeService({ resolve: () => activePending.promise }, [
      { providerId: otherId, resolve: () => otherPending.promise },
    ]);

    const oldPlay = service.play([track("same")], track("same"));
    const newPlay = service.play([track("same", otherId)], track("same", otherId));

    otherPending.resolve([{ playbackId: "same", playUrl: "other://same" }]);
    await expect(newPlay).resolves.toMatchObject({ status: "started" });
    expect(playNow).toHaveBeenCalledTimes(1);
    expect(playNow.mock.calls[0][1]).toMatchObject({
      providerId: otherId,
      playUrl: "other://same",
    });

    activePending.resolve([{ playbackId: "same", playUrl: "test://stale" }]);
    await expect(oldPlay).resolves.toMatchObject({ status: "superseded" });
    expect(playNow).toHaveBeenCalledTimes(1);
  });

  it("does not revive a cleared queue when an older play() resolves late", async () => {
    const pending = defer<TrackPlayUrl[]>();
    const { service, playNow, clear } = makeService({
      resolve: () => pending.promise,
    });

    const playing = service.play([track("a")], track("a"));
    service.clearQueue();

    expect(clear).toHaveBeenCalledTimes(1);

    pending.resolve([]);
    await expect(playing).resolves.toMatchObject({ status: "superseded" });

    expect(playNow).not.toHaveBeenCalled();
  });

  it("resolves an old queue item through its own provider after the active source changed", async () => {
    const activeResolve = vi.fn<PlaybackResolver["resolve"]>(async () => []);
    const oldSourceId = ProviderId.of("old-source");
    const oldResolve = vi.fn<PlaybackResolver["resolve"]>(async (ids) =>
      ids.map((playbackId) => ({ playbackId, playUrl: `old://${playbackId}` })),
    );
    const { service, playNow } = makeService({ resolve: activeResolve }, [
      { providerId: oldSourceId, diagnosticName: "old", resolve: oldResolve },
    ]);
    const queued = track("song", oldSourceId);

    await service.play([queued], queued);

    expect(activeResolve).not.toHaveBeenCalled();
    expect(oldResolve).toHaveBeenCalledWith(["song"]);
    expect(playNow.mock.calls[0][0][0].playUrl).toBe("old://song");
  });

  it("keeps identical playback ids isolated between providers in a mixed queue", async () => {
    const otherId = ProviderId.of("other");
    const { service, playNow } = makeService(
      {
        resolve: async () => [{ playbackId: "same", playUrl: "test://same" }],
      },
      [
        {
          providerId: otherId,
          resolve: async () => [{ playbackId: "same", playUrl: "other://same" }],
        },
      ],
    );
    const active = track("same", TEST_PROVIDER_ID);
    const other = track("same", otherId);

    await service.play([active, other], other);

    expect(playNow.mock.calls[0][0].map((item) => item.playUrl)).toEqual([
      "test://same",
      "other://same",
    ]);
    expect(playNow.mock.calls[0][1]?.providerId).toBe(otherId);
  });

  it("shufflePlay turns shuffle on before starting; an empty list is a no-op", async () => {
    const { service, playNow, setShuffle } = makeService({});

    await expect(service.shufflePlay([])).resolves.toEqual({ status: "empty", resolutions: [] });
    expect(setShuffle).not.toHaveBeenCalled();
    expect(playNow).not.toHaveBeenCalled();

    await expect(service.shufflePlay([track("a"), track("b")])).resolves.toMatchObject({
      status: "started",
    });
    expect(setShuffle).toHaveBeenCalledWith(true);
    expect(playNow).toHaveBeenCalledTimes(1);
  });

  it("routes play-next queue edits through the queue capability", () => {
    const { service, addNext } = makeService({});
    const queued = track("next");

    service.addNextToQueue(queued);

    expect(addNext).toHaveBeenCalledWith(queued);
  });
});
