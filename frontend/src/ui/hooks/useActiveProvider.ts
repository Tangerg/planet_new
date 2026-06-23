import { Provider } from "@providers";
import { usePlanet } from "./usePlanet";

export const useActiveProvider = <T extends Provider = Provider>(): T => {
  const planet = usePlanet();
  const provider = planet.getPlugin<T>(Provider.PLUGIN_ID);
  if (!provider) {
    throw new Error(
      "No provider plugin registered. Register one (e.g. NeteaseCloudMusic) on the Planet instance.",
    );
  }
  return provider;
};
