import type { AudioAnalysisService } from "@core";
import { useEngine } from "./useEngine";

/** Audio analysis use-case service. UI reads analyser samples through this
 * facade and never resolves kernel plugins directly. */
export function useAudioAnalysisService(): AudioAnalysisService {
  return useEngine().audio;
}
