import { describe, expect, it, vi } from "vitest";

import type { Event } from "dougong";
import type { Track } from "@domain/model/track";
import { PlayState } from "@domain/model/play-state";
import { ProviderId } from "@domain/model/provider-id";
import type { PlaybackResolver } from "@domain/ports/playback";

import { PLAY_STATE_CHANGED, TRACK_ENDED, type Broadcast } from "../../kernel";
import type { ProviderRegistryPort } from "../provider-registry";
import type { PlayQueueRuntime } from "../playqueue";
import { AudioPlaybackAdapter } from "./index";

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
function makeProviders(resolve?: PlaybackResolver["resolve"]): ProviderRegistryPort {
  const provider = resolve
    ? {
        playback: {
          providerId: PROVIDER,
          diagnosticName: "test",
          policy: { canResolveFullPlayback: true, canUsePreviewPlayback: false },
          resolve,
        } satisfies PlaybackResolver,
      }
    : null;
  return {
    active: provider,
    providers: provider ? [provider] : [],
    get: (id: ProviderId) => (id === PROVIDER ? provider : null),
    setActive: () => false,
  } as unknown as ProviderRegistryPort;
}

function mount(opts?: { resolve?: PlaybackResolver["resolve"]; next?: () => void }) {
  const facts: { fact: Event<unknown>; payload: unknown }[] = [];
  const broadcast: Broadcast = (fact, ...payload) => {
    facts.push({ fact: fact as Event<unknown>, payload: payload[0] });
  };
  const audioElement = makeAudioElement();
  const adapter = new AudioPlaybackAdapter({
    audioElement,
    providers: makeProviders(opts?.resolve),
    queue: { next: opts?.next ?? (() => {}) } as unknown as PlayQueueRuntime,
    broadcast,
  });

  const stated = <T>(fact: Event<T>): T[] =>
    facts.filter((entry) => entry.fact === fact).map((entry) => entry.payload as T);

  return { adapter, audioElement, states: () => stated(PLAY_STATE_CHANGED), stated };
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

describe("AudioPlaybackAdapter", () => {
  it("loads the provider playUrl directly into the audible audio element", async () => {
    const { adapter, audioElement, states } = mount();

    adapter.onCurrentChanged(track("song", "provider:url"));
    await Promise.resolve();

    expect(audioElement.src).toBe("provider:url");
    expect(audioElement.play).toHaveBeenCalledTimes(1);
    expect(states().at(-1)).toBe(PlayState.PLAYING);
  });

  it("stops playback when the current track has no playable URL", () => {
    const { adapter, audioElement, states } = mount();
    audioElement.src = "provider:url";

    adapter.onCurrentChanged(track("song"));

    expect(audioElement.pause).toHaveBeenCalled();
    expect(audioElement.src).toBe("");
    expect(states().at(-1)).toBe(PlayState.STOPPED);
  });

  it("marks playback stopped before broadcasting that the track ended", () => {
    const { audioElement, states, stated } = mount();

    listener(audioElement, "ended")();

    expect(states().at(-1)).toBe(PlayState.STOPPED);
    expect(stated(TRACK_ENDED)).toHaveLength(1);
  });

  it("states nothing further once released, including a pending play continuation", async () => {
    const { adapter, audioElement, states } = mount();
    let finishPlay!: () => void;
    const pendingPlay = new Promise<void>((resolve) => {
      finishPlay = resolve;
    });
    vi.mocked(audioElement.play).mockReturnValueOnce(pendingPlay);
    audioElement.src = "provider:url";

    const resume = adapter.resume();
    adapter.release();
    finishPlay();

    await expect(resume).resolves.toBeUndefined();
    expect(states()).toEqual([]);
  });

  it("re-resolves a fresh URL and reloads when the current source errors", async () => {
    const resolve = vi.fn<PlaybackResolver["resolve"]>(async (ids) =>
      ids.map((playbackId) => ({ playbackId, playUrl: `fresh://${playbackId}` })),
    );
    const { adapter, audioElement } = mount({ resolve });
    adapter.onCurrentChanged(track("song", "stale://song"));
    (audioElement as { currentSrc: string }).currentSrc = "stale://song";

    listener(audioElement, "error")();
    await flush();

    expect(resolve).toHaveBeenCalledWith(["song"]);
    expect(audioElement.src).toBe("fresh://song");
  });

  it("skips to the next track when a fresh URL can't be resolved", async () => {
    const next = vi.fn<() => void>();
    const { adapter, audioElement } = mount({ resolve: async () => [], next });
    adapter.onCurrentChanged(track("dead", "stale://dead"));
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
