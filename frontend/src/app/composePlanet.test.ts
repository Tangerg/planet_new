import { describe, expect, it, vi } from "vitest";

import { definePlugin } from "dougong";
import { type AudioRuntimePort } from "@core";
import { AUDIO_ANALYSER, MUSIC_SOURCES, PROVIDER_REGISTRY } from "@core/plugin";
import { PLAY_QUEUE, PROGRESS, RepeatMode, TRANSPORT, VOLUME_CONTROL } from "@contexts/playback";
import { LocalMusic } from "@providers";
import { usePlayQueueStore } from "@/store/playqueue";
import { composePlanet } from "./composePlanet";

class FakeAudioElement extends EventTarget {
  src = "";
  currentTime = 0;
  duration = Number.NaN;
  volume = 1;
  readonly play = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  readonly pause = vi.fn<() => void>();
}

function audioRuntime() {
  const audioElement = new FakeAudioElement();
  const dispose = vi.fn<() => void>();
  const runtime: AudioRuntimePort = {
    audioElement: audioElement as unknown as HTMLAudioElement,
    audioContext: {} as AudioContext,
    createAnalysisElement: () => new FakeAudioElement() as unknown as HTMLAudioElement,
    dispose,
  };
  return { audioElement, dispose, runtime };
}

/** Drain the microtask queue that carries an un-awaited kernel broadcast. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("application kernel composition", () => {
  it("pins kernel-seeded playback state into the store before React can subscribe", async () => {
    const audio = audioRuntime();
    audio.audioElement.volume = 0.4;
    const provider = new LocalMusic();
    const host = await composePlanet({
      providers: [provider],
      activeProviderId: provider.providerId,
      audio: audio.runtime,
      random: { next: () => 0.5 },
      resolveAnalysisSource: async (url) => url,
    });
    await flush();

    // The volume plugin broadcasts the element's real level during setup. The
    // bridge declares no requirements, so it starts a layer earlier and its
    // listeners are already published — otherwise the UI would show its own
    // hardcoded default instead.
    expect(usePlayQueueStore.getState().volume).toBe(40);

    host.get(PLAY_QUEUE).toggleShuffle();
    host.get(PLAY_QUEUE).cycleRepeat();
    await flush();
    expect(usePlayQueueStore.getState().shuffle).toBe(true);
    expect(usePlayQueueStore.getState().repeat).not.toBe(RepeatMode.OFF);

    await host.stop();
  });

  it("assembles the real provider/playback graph and releases it on stop", async () => {
    const audio = audioRuntime();
    const provider = new LocalMusic();
    const addListener = vi.spyOn(audio.audioElement, "addEventListener");
    const removeListener = vi.spyOn(audio.audioElement, "removeEventListener");
    const host = await composePlanet({
      providers: [provider],
      activeProviderId: provider.providerId,
      audio: audio.runtime,
      random: { next: () => 0.5 },
      resolveAnalysisSource: async (url) => url,
    });

    expect(host.get(PROVIDER_REGISTRY).providers).toHaveLength(1);
    expect(host.get(PROVIDER_REGISTRY).active?.providerId).toBe(provider.providerId);
    expect(host.get(TRANSPORT)).toBeDefined();
    expect(host.get(PLAY_QUEUE)).toBeDefined();
    expect(host.get(VOLUME_CONTROL)).toBeDefined();
    expect(host.get(PROGRESS)).toBeDefined();
    expect(host.get(AUDIO_ANALYSER)).toBeDefined();
    // ended + error (playback) + timeupdate + durationchange (progress).
    expect(addListener).toHaveBeenCalledTimes(4);

    await host.stop();

    expect(() => host.get(PROVIDER_REGISTRY)).toThrow("not active");
    expect(() => host.get(TRANSPORT)).toThrow("not active");
    expect(removeListener).toHaveBeenCalledTimes(4);
    expect(audio.dispose).toHaveBeenCalledTimes(1);
  });

  it("rolls the whole graph back when an app extension fails to start", async () => {
    const audio = audioRuntime();
    const provider = new LocalMusic();
    const failing = definePlugin({
      name: "test.failing-app-extension",
      requires: { sources: MUSIC_SOURCES },
      setup() {
        throw new Error("extension startup failed");
      },
    });

    await expect(
      composePlanet({
        providers: [provider],
        activeProviderId: provider.providerId,
        audio: audio.runtime,
        random: { next: () => 0.5 },
        resolveAnalysisSource: async (url) => url,
        extend: (installer) => installer.install(failing),
      }),
    ).rejects.toThrow("extension startup failed");
    // The transaction is all-or-nothing: no Instance survives a failed start,
    // so the audio runtime this composition took ownership of is released too.
    expect(audio.dispose).toHaveBeenCalledTimes(1);
  });
});
