import { describe, expect, it, vi } from "vitest";

import { Plugin, type AudioRuntimePort } from "@core";
import { AUDIO_ANALYSER, MUSIC_SOURCE, PROVIDER_REGISTRY } from "@core/plugin";
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

describe("application Planet composition", () => {
  it("pins kernel-seeded playback state into the store before React can subscribe", () => {
    const audio = audioRuntime();
    audio.audioElement.volume = 0.4;
    const provider = new LocalMusic();
    const planet = composePlanet({
      providers: [provider],
      activeProviderId: provider.providerId,
      audio: audio.runtime,
      random: { next: () => 0.5 },
      resolveAnalysisSource: async (url) => url,
    });

    // The Volume plugin broadcasts the element's real level during init; without
    // the bridge pinning it, the UI would show its own hardcoded default instead.
    expect(usePlayQueueStore.getState().volume).toBe(40);

    planet.resolve(PLAY_QUEUE)?.toggleShuffle();
    planet.resolve(PLAY_QUEUE)?.cycleRepeat();
    expect(usePlayQueueStore.getState().shuffle).toBe(true);
    expect(usePlayQueueStore.getState().repeat).not.toBe(RepeatMode.OFF);

    planet.dispose();
  });

  it("assembles the real provider/playback graph and revokes every capability on dispose", () => {
    const audio = audioRuntime();
    const provider = new LocalMusic();
    const addListener = vi.spyOn(audio.audioElement, "addEventListener");
    const removeListener = vi.spyOn(audio.audioElement, "removeEventListener");
    const planet = composePlanet({
      providers: [provider],
      activeProviderId: provider.providerId,
      audio: audio.runtime,
      random: { next: () => 0.5 },
      resolveAnalysisSource: async (url) => url,
    });

    expect(planet.resolveAll(MUSIC_SOURCE)).toHaveLength(1);
    expect(planet.resolve(PROVIDER_REGISTRY)?.active?.providerId).toBe(provider.providerId);
    expect(planet.resolve(TRANSPORT)).not.toBeNull();
    expect(planet.resolve(PLAY_QUEUE)).not.toBeNull();
    expect(planet.resolve(VOLUME_CONTROL)).not.toBeNull();
    expect(planet.resolve(PROGRESS)).not.toBeNull();
    expect(planet.resolve(AUDIO_ANALYSER)).not.toBeNull();
    // ended + error (playback) + timeupdate + durationchange (progress).
    expect(addListener).toHaveBeenCalledTimes(4);

    planet.dispose();

    expect(planet.resolveAll(MUSIC_SOURCE)).toEqual([]);
    expect(planet.resolve(PROVIDER_REGISTRY)).toBeNull();
    expect(planet.resolve(TRANSPORT)).toBeNull();
    expect(removeListener).toHaveBeenCalledTimes(4);
    expect(audio.dispose).toHaveBeenCalledTimes(1);
  });

  it("rolls back the real graph when an app extension fails to initialize", () => {
    class FailingExtension extends Plugin {
      readonly id = "failing-app-extension";
      protected override onInit(): void {
        throw new Error("extension startup failed");
      }
    }

    const audio = audioRuntime();
    const provider = new LocalMusic();
    expect(() =>
      composePlanet({
        providers: [provider],
        activeProviderId: provider.providerId,
        audio: audio.runtime,
        random: { next: () => 0.5 },
        resolveAnalysisSource: async (url) => url,
        additionalPlugins: [new FailingExtension()],
      }),
    ).toThrow("extension startup failed");
    expect(audio.dispose).toHaveBeenCalledTimes(1);
  });
});
