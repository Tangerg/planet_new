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
import { AudioPlaybackAdapter, PlayState, TRANSPORT } from "./index";

const PROVIDER = ProviderId.of("test");

const track = (id: string, playUrl?: string): Track => ({
  providerId: PROVIDER,
  id,
  playbackId: id,
  name: id,
  durationMs: 1000,
  artists: [],
  playUrl,
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
  const plugin = new AudioPlaybackAdapter();
  plugin.init({ hooks, registry, audioElement } as unknown as PluginContext);
  return { plugin, hooks, registry, audioElement };
}

/** Pull a registered DOM listener off the mocked audio element. */
function listener(audioElement: HTMLAudioElement, event: string): () => void {
  const calls = (
    audioElement.addEventListener as unknown as { mock: { calls: [string, () => void][] } }
  ).mock.calls;
  return calls.find(([name]) => name === event)?.[1] ?? (() => {});
}

/** Flush the async re-resolve chain. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("AudioPlaybackAdapter plugin", () => {
  it("provides the TRANSPORT capability once mounted", () => {
    const { plugin, registry } = mount();
    expect(registry.resolve(TRANSPORT)).toBe(plugin);
  });

  it("loads the provider playUrl directly into the audible audio element", async () => {
    const { hooks, audioElement } = mount();
    const states: PlayState[] = [];
    hooks.on("playback:state-changed", (state) => states.push(state));

    hooks.emit("queue:current-changed", track("song", "provider:url"));
    await Promise.resolve();

    expect(audioElement.src).toBe("provider:url");
    expect(audioElement.play).toHaveBeenCalledTimes(1);
    expect(states.at(-1)).toBe(PlayState.PLAYING);
  });

  it("stops playback when the current track has no playable URL", () => {
    const { hooks, audioElement } = mount();
    const states: PlayState[] = [];
    audioElement.src = "provider:url";
    hooks.on("playback:state-changed", (state) => states.push(state));

    hooks.emit("queue:current-changed", track("song"));

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

  it("re-resolves a fresh URL and reloads when the current source errors", async () => {
    const resolve = vi.fn<PlaybackResolver["resolve"]>(async (ids) =>
      ids.map((playbackId) => ({ playbackId, playUrl: `fresh://${playbackId}` })),
    );
    const { hooks, audioElement } = mount({ resolve });
    hooks.emit("queue:current-changed", track("song", "stale://song"));
    (audioElement as { currentSrc: string }).currentSrc = "stale://song";

    listener(audioElement, "error")();
    await flush();

    expect(resolve).toHaveBeenCalledWith(["song"]);
    expect(audioElement.src).toBe("fresh://song");
  });

  it("skips to the next track when a fresh URL can't be resolved", async () => {
    const next = vi.fn<() => void>();
    const { hooks, audioElement } = mount({ resolve: async () => [], next });
    hooks.emit("queue:current-changed", track("dead", "stale://dead"));
    (audioElement as { currentSrc: string }).currentSrc = "stale://dead";

    listener(audioElement, "error")();
    await flush();

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("ignores the empty-source error from a stop() reset", () => {
    const next = vi.fn<() => void>();
    const resolve = vi.fn<PlaybackResolver["resolve"]>(async () => []);
    const { audioElement } = mount({ resolve, next }); // currentSrc stays ""

    listener(audioElement, "error")();

    expect(resolve).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
