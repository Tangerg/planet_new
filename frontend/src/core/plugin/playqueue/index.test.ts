import { describe, expect, it } from "vitest";

import type { Track } from "@domain/model/track";

import { EventEmitter } from "../../event";
import type { PlanetEventMap } from "../../kernel/event";
import { CapabilityRegistry } from "../../kernel/capability";
import type { PluginContext } from "../../kernel/context";
import "../playback"; // pulls the "playback:track-ended" event-type augmentation
import { PLAY_QUEUE, PlayQueue } from "./index";

const track = (id: string): Track => ({ id, name: id, durationMs: 1000, artists: [] });

function mount() {
  const hooks = new EventEmitter<PlanetEventMap>();
  const registry = new CapabilityRegistry();
  const plugin = new PlayQueue();
  plugin.init({ hooks, registry } as unknown as PluginContext);
  return { plugin, hooks, registry };
}

describe("PlayQueue plugin event flow", () => {
  it("provides the PLAY_QUEUE capability once mounted", () => {
    const { plugin, registry } = mount();
    expect(registry.resolve(PLAY_QUEUE)).toBe(plugin);
  });

  it("broadcasts queue + current facts on playNow / next / previous / add", () => {
    const { plugin, hooks } = mount();
    const currents: (Track | undefined)[] = [];
    const queues: (readonly Track[])[] = [];
    hooks.on("queue:current-changed", (t) => currents.push(t));
    hooks.on("queue:changed", (q) => queues.push(q));

    const [a, b, c] = [track("a"), track("b"), track("c")];
    plugin.playNow([a, b], a);
    expect(queues.at(-1)).toEqual([a, b]);
    expect(currents.at(-1)).toBe(a);

    plugin.next();
    expect(currents.at(-1)).toBe(b);
    plugin.previous();
    expect(currents.at(-1)).toBe(a);

    plugin.add(c);
    expect(queues.at(-1)).toEqual([a, b, c]);
  });

  it("auto-advances on playback:track-ended, then stops at the tail (repeat off)", () => {
    const { plugin, hooks } = mount();
    const currents: (Track | undefined)[] = [];
    hooks.on("queue:current-changed", (t) => currents.push(t));

    const [a, b] = [track("a"), track("b")];
    plugin.playNow([a, b], a); // current → a
    const afterPlay = currents.length;

    hooks.emit("playback:track-ended");
    expect(currents.at(-1)).toBe(b); // advanced a → b

    hooks.emit("playback:track-ended");
    // b is the last track and repeat is off → "stopped", no new current fact.
    expect(currents.length).toBe(afterPlay + 1);
  });
});
