import { describe, expect, it, vi } from "vitest";

import { createHost, definePlugin } from "dougong";
import type { Track } from "@domain/model/track";
import { ProviderId } from "@domain/model/provider-id";

import { AUDIO_RUNTIME, CURRENT_TRACK_CHANGED, type AudioRuntimePort } from "../../kernel";
import type { MediaAnalysisSourceResolver } from "../media-source";
import { audioEnginePlugin } from "./index";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function makeProbeElement() {
  const probe = {
    src: "",
    preload: "",
    crossOrigin: "",
    currentTime: 0,
    play: vi.fn<() => Promise<void>>(async () => {}),
    pause: vi.fn<() => void>(),
    load: vi.fn<() => void>(),
    removeAttribute: vi.fn<(name: string) => void>((name) => {
      if (name === "src") probe.src = "";
    }),
  };
  return probe;
}

function makeAudioRuntime() {
  const connect = () => ({
    connect: vi.fn<(node: unknown) => void>(),
    disconnect: vi.fn<() => void>(),
  });
  const node = connect();
  const gain = { gain: { value: 1 }, ...connect() };
  const probes: ReturnType<typeof makeProbeElement>[] = [];
  const runtime: AudioRuntimePort = {
    audioElement: { currentTime: 0 } as HTMLAudioElement,
    audioContext: {
      state: "running",
      destination: {},
      resume: vi.fn<() => Promise<void>>(async () => {}),
      createMediaElementSource: () => node,
      createAnalyser: () => node,
      createGain: () => gain,
    } as unknown as AudioContext,
    createAnalysisElement: () => {
      const probe = makeProbeElement();
      probes.push(probe);
      return probe as unknown as HTMLAudioElement;
    },
    dispose: () => undefined,
  };
  return { runtime, probes };
}

const track = (id: string, playUrl: string): Track => ({
  providerId: ProviderId.of("test"),
  id,
  playbackId: id,
  name: id,
  durationMs: 1000,
  artists: [],
  playUrl,
});

/** Drain the microtask queue that carries a spawned load. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function mount(resolveAnalysisSource: MediaAnalysisSourceResolver) {
  const { runtime, probes } = makeAudioRuntime();
  let announce!: (current: Track | undefined) => Promise<void>;

  const host = createHost({ name: "audio-engine-test" });
  host.install(
    definePlugin({
      name: "test.audio-runtime",
      provides: { audio: AUDIO_RUNTIME },
      setup: () => ({ audio: runtime }),
    }),
  );
  host.install(audioEnginePlugin, { resolveAnalysisSource });
  host.install(
    definePlugin({
      name: "test.track-driver",
      setup(ctx) {
        announce = (current) => ctx.emit(CURRENT_TRACK_CHANGED, current);
      },
    }),
  );
  await host.start();

  return { host, probes, announce };
}

describe("audio engine plugin", () => {
  it("lets a newer track supersede a load whose analysis URL is still resolving", async () => {
    const first = deferred<string>();
    const resolveAnalysisSource = vi
      .fn<MediaAnalysisSourceResolver>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce("loopback:second");
    const { host, probes, announce } = await mount(resolveAnalysisSource);

    await announce(track("first", "provider:first"));
    await announce(track("second", "provider:second"));
    await flush();

    expect(probes).toHaveLength(1);
    expect(probes[0].src).toBe("loopback:second");

    // The stale resolve lands late; disposing its Task already aborted the signal.
    first.resolve("loopback:first");
    await flush();
    expect(probes[0].src).toBe("loopback:second");

    await host.stop();
  });

  it("abandons a load still in the air when the graph stops", async () => {
    const pending = deferred<string>();
    const { host, probes, announce } = await mount(() => pending.promise);

    await announce(track("first", "provider:first"));
    await flush();
    // The probe element is only built once a URL resolves, so nothing yet.
    expect(probes).toHaveLength(0);

    // Lifetime teardown disposes spawned tasks before running cleanups, so the
    // resolve that lands afterwards must not reach the released probe. Were the
    // signal not aborted, this would build an element and load it.
    await host.stop();
    pending.resolve("loopback:first");
    await flush();

    expect(probes).toHaveLength(0);
  });
});
