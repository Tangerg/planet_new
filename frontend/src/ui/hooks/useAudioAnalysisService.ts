import type { AudioAnalysisService } from "@core";
import { useEngine } from "./useEngine";

export function useAudioAnalysisService(): AudioAnalysisService {
  return useEngine().audio;
}
