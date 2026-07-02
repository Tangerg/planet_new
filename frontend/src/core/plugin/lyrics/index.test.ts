import { describe, expect, it, vi } from "vitest";

import type { Lyric } from "@domain/model/lyric";
import type { MusicProvider } from "@domain";
import type { Track } from "@domain/model/track";

import { EventEmitter } from "../../event";
import type { PlanetEventMap } from "../../kernel/event";
import { CapabilityRegistry } from "../../kernel/capability";
import type { PluginContext } from "../../kernel/context";
import { PROVIDER_REGISTRY, type ProviderRegistryPort } from "../provider-registry";
import "../playqueue"; // pulls the "queue:current-changed" event-type augmentation
import { Lyrics } from "./index";

const LINES: Lyric[] = [{ content: "hello", duration: 0 }];
const track = (id: string): Track => ({ id, name: id, durationMs: 1000, artists: [] });

function mount(lyric: MusicProvider["lyric"]) {
  const hooks = new EventEmitter<PlanetEventMap>();
  const registry = new CapabilityRegistry();
  const port = { active: { lyric } as unknown as MusicProvider } as unknown as ProviderRegistryPort;
  registry.provide(PROVIDER_REGISTRY, port);
  new Lyrics().init({ hooks, registry } as unknown as PluginContext);
  const nextLyrics = () => new Promise<Lyric[]>((res) => hooks.once("lyrics:changed", res));
  return { hooks, nextLyrics };
}

describe("Lyrics plugin follows the current track", () => {
  it("fetches the active provider's lyrics when the track changes", async () => {
    const lyric = vi.fn<MusicProvider["lyric"]>(async () => LINES);
    const { hooks, nextLyrics } = mount(lyric);

    const changed = nextLyrics();
    hooks.emit("queue:current-changed", track("1"));
    expect(await changed).toEqual(LINES);
    expect(lyric).toHaveBeenCalledWith("1");
  });

  it("does not refetch when the same track re-emits", async () => {
    const lyric = vi.fn<MusicProvider["lyric"]>(async () => LINES);
    const { hooks, nextLyrics } = mount(lyric);

    const first = nextLyrics();
    hooks.emit("queue:current-changed", track("1"));
    await first;
    hooks.emit("queue:current-changed", track("1")); // same id → deduped
    expect(lyric).toHaveBeenCalledTimes(1);
  });

  it("clears lyrics when there is no current track", async () => {
    const lyric = vi.fn<MusicProvider["lyric"]>(async () => LINES);
    const { hooks, nextLyrics } = mount(lyric);

    const changed = nextLyrics();
    hooks.emit("queue:current-changed", undefined);
    expect(await changed).toEqual([]);
    expect(lyric).not.toHaveBeenCalled();
  });

  it("drops a stale fetch when the track changes again mid-flight (generation guard)", async () => {
    const gate: Array<(lines: Lyric[]) => void> = [];
    const lyric = vi.fn<MusicProvider["lyric"]>(
      () => new Promise<Lyric[]>((res) => gate.push(res)),
    );
    const { hooks, nextLyrics } = mount(lyric);

    hooks.emit("queue:current-changed", track("1")); // slow fetch #0
    hooks.emit("queue:current-changed", track("2")); // supersedes → fetch #1

    const changed = nextLyrics();
    gate[1](LINES); // track 2 resolves → its lyrics win
    expect(await changed).toEqual(LINES);

    // Track 1 (stale) resolves late; its result must be dropped, not emitted.
    let leaked = false;
    hooks.once("lyrics:changed", () => (leaked = true));
    gate[0]([{ content: "stale", duration: 0 }]);
    await Promise.resolve();
    expect(leaked).toBe(false);
  });
});
