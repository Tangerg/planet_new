import { describe, expect, it, vi } from "vitest";

import { Engine, type AudioRuntimePort } from "@core";
import type { CatalogPorts, Personalized, TrackSnapshot } from "@contexts/catalog";
import { ProviderId, type ProviderId as ProviderIdValue } from "@contexts/contracts";
import type { CredentialStore } from "@contexts/identity";
import type { PlaybackAvailabilityPolicy } from "@contexts/playback";
import { Provider } from "@providers";
import { composePlanet } from "./composePlanet";

class ScenarioAudio extends EventTarget {
  src = "";
  currentTime = 0;
  duration = 180;
  volume = 1;
  readonly play = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  readonly pause = vi.fn<() => void>();
}

class ScenarioProvider extends Provider {
  readonly resolveCalls: string[][] = [];

  constructor(
    readonly providerId: ProviderIdValue,
    readonly name: string,
    private readonly tracks: TrackSnapshot[],
  ) {
    super();
  }

  protected get catalogPorts(): CatalogPorts {
    return {
      home: { personalized: () => this.personalized() },
      playlists: null,
      albums: null,
      artists: null,
      tracks: null,
      search: null,
      charts: null,
      musicVideos: null,
      artistMusicVideos: null,
    };
  }

  protected get playbackPolicy(): PlaybackAvailabilityPolicy {
    return { canResolveFullPlayback: true, canUsePreviewPlayback: false };
  }

  async personalized(): Promise<Personalized> {
    return { playlists: [], albums: [], artists: [], tracks: this.tracks };
  }

  async playUrls(playbackIds: string[]) {
    this.resolveCalls.push(playbackIds);
    return playbackIds.map((playbackId) => ({
      playbackId,
      playUrl: `https://audio.test/${this.providerId}/${playbackId}`,
    }));
  }
}

const credentials: CredentialStore = {
  get: () => null,
  set: () => undefined,
  clear: () => undefined,
};

function track(providerId: ProviderIdValue, id: string): TrackSnapshot {
  return {
    providerId,
    id,
    playbackId: id,
    name: `${providerId}:${id}`,
    durationMs: 180_000,
    artists: [],
  };
}

describe("core application flow", () => {
  it("browses, plays, switches source, continues the old queue, and releases runtime state", async () => {
    const firstId = ProviderId.of("scenario-first");
    const secondId = ProviderId.of("scenario-second");
    const firstTracks = [track(firstId, "one"), track(firstId, "two")];
    const first = new ScenarioProvider(firstId, "First", firstTracks);
    const second = new ScenarioProvider(secondId, "Second", [track(secondId, "other")]);
    const audioElement = new ScenarioAudio();
    const disposeAudio = vi.fn<() => void>();
    const audio: AudioRuntimePort = {
      audioElement: audioElement as unknown as HTMLAudioElement,
      audioContext: {} as AudioContext,
      createAnalysisElement: () => new ScenarioAudio() as unknown as HTMLAudioElement,
      dispose: disposeAudio,
    };
    const planet = composePlanet({
      providers: [first, second],
      activeProviderId: firstId,
      audio,
      random: { next: () => 0.5 },
      resolveAnalysisSource: async (url) => url,
    });
    const engine = new Engine(planet, credentials);

    const firstHome = await engine.media.personalized();
    expect(firstHome).toMatchObject({ status: "success" });
    const browsedTracks = firstHome.status === "success" ? (firstHome.data.tracks ?? []) : [];
    await engine.playback.play([...browsedTracks], browsedTracks[0]);
    expect(first.resolveCalls).toEqual([["one", "two"]]);
    expect(audioElement.src).toBe("https://audio.test/scenario-first/one");

    expect(engine.providers.setActive(secondId)).toBe(true);
    const secondHome = await engine.media.personalized();
    expect(secondHome.status === "success" ? secondHome.data.tracks?.[0]?.providerId : null).toBe(
      secondId,
    );

    engine.playback.next();
    expect(audioElement.src).toBe("https://audio.test/scenario-first/two");
    expect(second.resolveCalls).toEqual([]);

    engine.dispose();
    expect(disposeAudio).toHaveBeenCalledTimes(1);
    expect(audioElement.pause).toHaveBeenCalled();
    expect(() => engine.providers).toThrow("ProviderRegistry plugin is not registered");
  });
});
