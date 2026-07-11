import { describe, expect, it, vi } from "vitest";

import { Plugin, type AudioRuntimePort } from "@core";
import { AUDIO_ANALYSER, MUSIC_SOURCE, PROVIDER_REGISTRY } from "@core/plugin";
import { PLAY_QUEUE, PROGRESS, TRANSPORT, VOLUME_CONTROL } from "@contexts/playback";
import { LocalMusic } from "@providers";
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
    expect(addListener).toHaveBeenCalledTimes(3);

    planet.dispose();

    expect(planet.resolveAll(MUSIC_SOURCE)).toEqual([]);
    expect(planet.resolve(PROVIDER_REGISTRY)).toBeNull();
    expect(planet.resolve(TRANSPORT)).toBeNull();
    expect(removeListener).toHaveBeenCalledTimes(3);
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
