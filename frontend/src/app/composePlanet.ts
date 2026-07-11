import { Planet, type AudioRuntimePort, type Plugin } from "@core";
import {
  AudioPlaybackAdapter,
  PlayQueueRuntime,
  ProgressRuntime,
  VolumeRuntime,
  type RandomSource,
} from "@contexts/playback";
import { AudioEngine, Lyrics, ProviderRegistry } from "@core/plugin";
import type { MediaAnalysisSourceResolver } from "@core/plugin";
import type { ProviderId } from "@contexts/contracts";
import type { Provider } from "@providers";
import { PlayQueueStoreBridge } from "@/store/bridge";

export type PlanetComposition = Readonly<{
  providers: readonly Provider[];
  activeProviderId: ProviderId;
  audio: AudioRuntimePort;
  random: RandomSource;
  resolveAnalysisSource: MediaAnalysisSourceResolver;
  /** Optional app-level extensions; useful for third-party plugins and composition tests. */
  additionalPlugins?: readonly Plugin[];
}>;

/** Assemble the real application plugin graph from explicit outer adapters. */
export function composePlanet(options: PlanetComposition): Planet {
  return new Planet({
    audio: options.audio,
    plugins: [
      ...options.providers,
      new AudioPlaybackAdapter(),
      new PlayQueueRuntime(options.random),
      new VolumeRuntime(),
      new ProgressRuntime(),
      new AudioEngine(options.resolveAnalysisSource),
      new ProviderRegistry(options.activeProviderId),
      new Lyrics(),
      new PlayQueueStoreBridge(),
      ...(options.additionalPlugins ?? []),
    ],
  });
}
