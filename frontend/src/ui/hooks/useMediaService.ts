import type { MediaService } from "@contexts/catalog";
import { useEngine } from "./useEngine";

export function useMediaService(): MediaService {
  return useEngine().media;
}
