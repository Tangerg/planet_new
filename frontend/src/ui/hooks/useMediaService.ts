import type { MediaService } from "@core";
import { useEngine } from "./useEngine";

/**
 * The catalog/browse use-case service from the Engine. Data hooks call this
 * (wrapped in React Query) and adapt the returned domain models to view shapes;
 * they never reference the provider or `MusicProvider` directly.
 */
export function useMediaService(): MediaService {
  return useEngine().media;
}
