import { describe, expect, it, vi } from "vitest";

import type { Track } from "@domain/model/track";
import { ProviderId } from "@domain/model/provider-id";
import type { PlaybackResolver } from "@domain/ports/playback";

import { EventEmitter } from "../../event";
import { CapabilityRegistry } from "../../kernel/capability";
import type { PluginContext } from "../../kernel/context";
import type { PlanetEventMap } from "../../kernel/event";
import { PROVIDER_REGISTRY } from "../provider-registry";
import { PLAY_QUEUE } from "../playqueue";
import { Playback, PlayState, TRANSPORT } from "./index";

const PROVIDER = ProviderId.of("test");

const track = (id: string, extra?: Partial<Track>): Track => ({
  providerId: PROVIDER,
  id,
  playbackId: id,
  name: id,
  durationMs: 1000,
  artists: [],
  ...extra,
});

function makeAudioElement() {
  return {
    src: "",
    currentSrc: "",
    play: vi.fn<() => Promise<void>>(async () => {}),
    pause: vi.fn<() => void>(),
    addEventListener: vi.fn<() => void>(),
    removeEventListener: vi.fn<() => void>(),
  } as unknown as HTMLAudioElement;
}

/** Provider registry stub exposing one full-URL playback resolver. */
function makeRegistry(resolve: PlaybackResolver["resolve"]) {
  const provider = {
    playback: {
      providerId: PROVIDER,
      diagnosticName: "test",
      policy: { canResolveFullPlayback: true, canUsePreviewPlayback: false },
      resolve,
    } satisfies PlaybackResolver,
  };
  return { active: provider, get: (id: ProviderId) => (id === PROVIDER ? provider : null) };
}

function mount(opts?: { resolve?: PlaybackResolver["resolve"]; next?: () => void }) {
  const hooks = new EventEmitter<PlanetEventMap>();
  const registry = new CapabilityRegistry();
  if (opts?.resolve) registry.provide(PROVIDER_REGISTRY, makeRegistry(opts.resolve) as never);
  if (opts?.next) registry.provide(PLAY_QUEUE, { next: opts.next } as never);
  const audioElement = makeAudioElement();
  const plugin = new Playback();
  plugin.init({ hooks, registry, audioElement } as unknown as PluginContext);
  return { plugin, hooks, registry, audioElement };
}

/** Flush the async resolve → play microtask chain. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Playback plugin", () => {
  it("provides the TRANSPORT capability once mounted", () => {
    const { plugin, registry } = mount();
    expect(registry.resolve(TRANSPORT)).toBe(plugin);
  });

  it("resolves a fresh provider URL just-in-time and plays it", async () => {
    const resolve = vi.fn<PlaybackResolver["resolve"]>(async (ids) =>
      ids.map((playbackId) => ({ playbackId, playUrl: `fresh://${playbackId}` })),
    );
    const { hooks, audioElement } = mount({ resolve });
    const states: PlayState[] = [];
    hooks.on("playback:state-changed", (state) => states.push(state));

    hooks.emit("queue:current-changed", track("song"));
    await flush();

    expect(resolve).toHaveBeenCalledWith(["song"]);
    expect(audioElement.src).toBe("fresh://song");
    expect(audioElement.play).toHaveBeenCalledTimes(1);
    expect(states.at(-1)).toBe(PlayState.PLAYING);
  });

  it("broadcasts the resolved track (fresh URL) for the analysis probe", async () => {
    const resolve = vi.fn<PlaybackResolver["resolve"]>(async (ids) =>
      ids.map((playbackId) => ({ playbackId, playUrl: `fresh://${playbackId}` })),
    );
    const { hooks } = mount({ resolve });
    let resolved: Track | undefined;
    hooks.on("playback:current-resolved", (t) => (resolved = t ?? undefined));

    hooks.emit("queue:current-changed", track("song"));
    await flush();

    expect(resolved?.playUrl).toBe("fresh://song");
  });

  it("plays a directly-playable track (local/preview) without a provider round-trip", async () => {
    const resolve = vi.fn<PlaybackResolver["resolve"]>(async () => []);
    const { hooks, audioElement } = mount({ resolve });

    hooks.emit("queue:current-changed", track("local", { playUrl: "file://local" }));
    await flush();

    expect(resolve).not.toHaveBeenCalled();
    expect(audioElement.src).toBe("file://local");
  });

  it("skips to the next track when resolution yields no URL", async () => {
    const next = vi.fn<() => void>();
    const { hooks } = mount({ resolve: async () => [], next });

    hooks.emit("queue:current-changed", track("dead"));
    await flush();

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("skips to the next track when a loaded source errors", () => {
    const next = vi.fn<() => void>();
    const { audioElement } = mount({ next });
    (audioElement as { currentSrc: string }).currentSrc = "fresh://song";
    const onError = (
      audioElement.addEventListener as unknown as { mock: { calls: [string, () => void][] } }
    ).mock.calls.find(([event]) => event === "error")?.[1];

    onError?.();

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("ignores an error fired by the empty-source reset (no spurious skip)", () => {
    const next = vi.fn<() => void>();
    const { audioElement } = mount({ next }); // currentSrc stays ""
    const onError = (
      audioElement.addEventListener as unknown as { mock: { calls: [string, () => void][] } }
    ).mock.calls.find(([event]) => event === "error")?.[1];

    onError?.();

    expect(next).not.toHaveBeenCalled();
  });

  it("clears the element and stops when the queue empties", () => {
    const { hooks, audioElement } = mount();
    audioElement.src = "fresh://song";
    const states: PlayState[] = [];
    hooks.on("playback:state-changed", (state) => states.push(state));

    hooks.emit("queue:current-changed", undefined);

    expect(audioElement.pause).toHaveBeenCalled();
    expect(audioElement.src).toBe("");
    expect(states.at(-1)).toBe(PlayState.STOPPED);
  });

  it("marks playback stopped before broadcasting that the track ended", () => {
    const { hooks, audioElement } = mount();
    const states: PlayState[] = [];
    let ended = 0;
    hooks.on("playback:state-changed", (state) => states.push(state));
    hooks.on("playback:track-ended", () => {
      ended += 1;
    });

    const onEnded = (
      audioElement.addEventListener as unknown as { mock: { calls: [string, () => void][] } }
    ).mock.calls.find(([event]) => event === "ended")?.[1];
    onEnded?.();

    expect(states.at(-1)).toBe(PlayState.STOPPED);
    expect(ended).toBe(1);
  });

  it("ignores a pending play continuation after disposal", async () => {
    const { plugin, hooks, audioElement } = mount();
    const states: PlayState[] = [];
    let finishPlay!: () => void;
    const pendingPlay = new Promise<void>((resolve) => {
      finishPlay = resolve;
    });
    vi.mocked(audioElement.play).mockReturnValueOnce(pendingPlay);
    audioElement.src = "provider:url";
    hooks.on("playback:state-changed", (state) => states.push(state));

    const resume = plugin.resume();
    plugin.dispose();
    finishPlay();

    await expect(resume).resolves.toBeUndefined();
    expect(states).toEqual([PlayState.STOPPED]);
  });
});
