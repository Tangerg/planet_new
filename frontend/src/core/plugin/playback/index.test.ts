import { describe, expect, it, vi } from "vitest";

import type { Track } from "@domain/model/track";
import { ProviderId } from "@domain/model/provider-id";

import { EventEmitter } from "../../event";
import { CapabilityRegistry } from "../../kernel/capability";
import type { PluginContext } from "../../kernel/context";
import type { PlanetEventMap } from "../../kernel/event";
import { Playback, PlayState, TRANSPORT } from "./index";

const track = (id: string, playUrl?: string): Track => ({
  providerId: ProviderId.of("test"),
  id,
  name: id,
  durationMs: 1000,
  artists: [],
  playUrl,
});

function makeAudioElement() {
  return {
    src: "",
    play: vi.fn<() => Promise<void>>(async () => {}),
    pause: vi.fn<() => void>(),
    addEventListener: vi.fn<() => void>(),
    removeEventListener: vi.fn<() => void>(),
  } as unknown as HTMLAudioElement;
}

function mount() {
  const hooks = new EventEmitter<PlanetEventMap>();
  const registry = new CapabilityRegistry();
  const audioElement = makeAudioElement();
  const plugin = new Playback();
  plugin.init({ hooks, registry, audioElement } as unknown as PluginContext);
  return { plugin, hooks, registry, audioElement };
}

describe("Playback plugin", () => {
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
});
