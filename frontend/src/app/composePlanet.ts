import { createHost, type Host } from "dougong";
import { audioRuntimePlugin, kernelLogger, type AudioRuntimePort } from "@core";
import {
  playbackPlugin,
  playQueuePlugin,
  progressPlugin,
  volumePlugin,
  type RandomSource,
} from "@contexts/playback";
import {
  audioEnginePlugin,
  lyricsPlugin,
  musicSourcePlugin,
  providerRegistryPlugin,
} from "@core/plugin";
import type { MediaAnalysisSourceResolver } from "@core/plugin";
import type { ProviderId } from "@contexts/contracts";
import type { Provider } from "@providers";
import { playQueueStoreBridge } from "@/store/bridge";

export type PlanetComposition = Readonly<{
  providers: readonly Provider[];
  activeProviderId: ProviderId;
  audio: AudioRuntimePort;
  random: RandomSource;
  resolveAnalysisSource: MediaAnalysisSourceResolver;
  /**
   * App-level extensions installed onto the same Host before it starts. A
   * callback rather than a Plugin array: every plugin carries its own
   * requires/provides/config types, and one array element type would erase
   * exactly the declarations the Host resolves the graph from. The parameter is
   * narrowed to installation — starting and stopping stay this function's job.
   */
  extend?: (installer: Pick<Host, "install" | "group" | "change">) => void;
}>;

/**
 * Assemble the real application plugin graph from explicit outer adapters and
 * start it. Install order is not startup order — dougong derives that from the
 * declared Service and ExtensionPoint edges — so this list reads as an
 * inventory, not a sequence.
 */
export async function composePlanet(options: PlanetComposition): Promise<Host> {
  const host = createHost({ name: "planet", logger: kernelLogger });

  host.install(audioRuntimePlugin, options.audio);
  host.install(playQueueStoreBridge);
  for (const provider of options.providers) host.install(musicSourcePlugin(provider.source));
  host.install(providerRegistryPlugin, { defaultActive: options.activeProviderId });
  host.install(playQueuePlugin, { random: options.random });
  host.install(playbackPlugin);
  host.install(volumePlugin);
  host.install(progressPlugin);
  host.install(audioEnginePlugin, { resolveAnalysisSource: options.resolveAnalysisSource });
  host.install(lyricsPlugin);
  options.extend?.(host);

  await host.start();
  return host;
}
