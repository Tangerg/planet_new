import type { IPlugin } from "@core";
import { type IProvider, PROVIDER_PLUGIN_ID } from "@domain";
import { usePlanet } from "./usePlanet";

/**
 * The currently mounted music provider, accessed through its `@domain` port.
 * The UI depends only on the IProvider contract — never the concrete
 * `@providers` infrastructure (the kernel resolves the instance by id).
 */
export function useActiveProvider(): IProvider {
  const planet = usePlanet();
  const provider = planet.getPlugin<IProvider & IPlugin>(PROVIDER_PLUGIN_ID);
  if (!provider) {
    throw new Error(
      "No provider plugin registered. Register one (e.g. NeteaseCloudMusic) on the Planet instance.",
    );
  }
  return provider;
}
