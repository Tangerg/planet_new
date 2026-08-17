import { describe, expect, it, vi } from "vitest";

import { createHost, definePlugin } from "dougong";
import type { Lyric } from "@domain/model/lyric";
import { ProviderId, type LyricProvider, type MusicSource } from "@domain";
import type { Track } from "@domain/model/track";

import { CURRENT_TRACK_CHANGED, LYRICS_CHANGED } from "../../kernel";
import { PROVIDER_REGISTRY, type ProviderRegistryPort } from "../provider-registry";
import { lyricsPlugin } from "./index";

const LINES: Lyric[] = [{ content: "hello", duration: 0 }];
const TEST_PROVIDER_ID = ProviderId.of("test");
const OTHER_PROVIDER_ID = ProviderId.of("other");
const track = (id: string, providerId = TEST_PROVIDER_ID): Track => ({
  providerId,
  id,
  name: id,
  durationMs: 1000,
  artists: [],
});

function musicProvider(
  providerId: MusicSource["providerId"],
  lyric: LyricProvider["lyric"],
): MusicSource {
  return { providerId, name: providerId, lyrics: { lyric } } as unknown as MusicSource;
}

/**
 * The plugin's whole behaviour is its reaction to a kernel fact, so it is
 * exercised on a real Host: a stub registry provides the Service it requires,
 * and a driver installation states the current-track fact and observes the
 * lyrics fact — exactly the seams the composed graph uses.
 */
async function mount(lyric: LyricProvider["lyric"], additionalProviders: MusicSource[] = []) {
  const active = musicProvider(TEST_PROVIDER_ID, lyric);
  const providers = [active, ...additionalProviders];
  const registry: ProviderRegistryPort = {
    active,
    providers,
    get: (providerId) => providers.find((p) => p.providerId === providerId) ?? null,
    setActive: () => false,
  };

  const emitted: (readonly Lyric[])[] = [];
  let announce!: (current: Track | undefined) => Promise<void>;
  const driver = definePlugin({
    name: "test.lyrics-driver",
    setup(ctx) {
      ctx.on(LYRICS_CHANGED, (lines) => emitted.push(lines));
      announce = (current) => ctx.emit(CURRENT_TRACK_CHANGED, current);
    },
  });

  const host = createHost({ name: "lyrics-test" });
  host.install(
    definePlugin({
      name: "test.provider-registry",
      provides: { registry: PROVIDER_REGISTRY },
      setup: () => ({ registry }),
    }),
  );
  host.install(lyricsPlugin);
  host.install(driver);
  await host.start();

  /** Announce a track and let the fire-and-forget lyrics fact land. */
  const play = async (current: Track | undefined) => {
    await announce(current);
    await flush();
  };
  return { host, emitted, announce, play };
}

/** Drain the microtask queue that carries an un-awaited broadcast. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("lyrics plugin follows the current track", () => {
  it("fetches the active provider's lyrics when the track changes", async () => {
    const lyric = vi.fn<LyricProvider["lyric"]>(async () => LINES);
    const { emitted, play } = await mount(lyric);

    await play(track("1"));

    expect(emitted.at(-1)).toEqual(LINES);
    expect(lyric).toHaveBeenCalledWith("1");
  });

  it("does not refetch when the same track re-emits", async () => {
    const lyric = vi.fn<LyricProvider["lyric"]>(async () => LINES);
    const { play } = await mount(lyric);

    await play(track("1"));
    await play(track("1")); // same id → deduped

    expect(lyric).toHaveBeenCalledTimes(1);
  });

  it("does refetch an identical local id when its provider changes", async () => {
    const activeLyric = vi.fn<LyricProvider["lyric"]>(async () => [
      { content: "active", duration: 0 },
    ]);
    const otherLyric = vi.fn<LyricProvider["lyric"]>(async () => [
      { content: "other", duration: 0 },
    ]);
    const { emitted, play } = await mount(activeLyric, [
      musicProvider(OTHER_PROVIDER_ID, otherLyric),
    ]);

    await play(track("same"));
    await play(track("same", OTHER_PROVIDER_ID));

    expect(emitted.at(-1)).toEqual([{ content: "other", duration: 0 }]);
    expect(activeLyric).toHaveBeenCalledTimes(1);
    expect(otherLyric).toHaveBeenCalledWith("same");
  });

  it("clears lyrics when there is no current track", async () => {
    const lyric = vi.fn<LyricProvider["lyric"]>(async () => LINES);
    const { emitted, play } = await mount(lyric);

    await play(undefined);

    expect(emitted.at(-1)).toEqual([]);
    expect(lyric).not.toHaveBeenCalled();
  });

  it("never issues a fetch for a track superseded before its task starts", async () => {
    const lyric = vi.fn<LyricProvider["lyric"]>(async () => LINES);
    const { emitted, announce } = await mount(lyric);

    // A spawned task body starts one microtask after `spawn`, so a supersede in
    // the same turn aborts the first task's signal before it runs. The request
    // is then never issued at all, rather than issued and thrown away.
    void announce(track("1"));
    void announce(track("2"));
    await flush();

    expect(lyric.mock.calls).toEqual([["2"]]);
    expect(emitted).toEqual([LINES]);
  });

  it("drops a stale fetch that resolves after a newer track has won", async () => {
    const gate: Array<(lines: Lyric[]) => void> = [];
    const lyric = vi.fn<LyricProvider["lyric"]>(
      () => new Promise<Lyric[]>((res) => gate.push(res)),
    );
    const { emitted, announce } = await mount(lyric);

    await announce(track("1")); // fetch #0 is genuinely in the air…
    await flush();
    expect(gate).toHaveLength(1);

    void announce(track("2")); // …when track 2 supersedes it → fetch #1
    await flush();
    expect(gate).toHaveLength(2);

    gate[1](LINES); // track 2 resolves → its lyrics win
    await flush();
    expect(emitted.at(-1)).toEqual(LINES);

    // Track 1 (stale) resolves late; abandoning the wait already dropped it.
    gate[0]([{ content: "stale", duration: 0 }]);
    await flush();
    expect(emitted).toHaveLength(1);
  });
});
