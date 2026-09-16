import { useMemo } from "react";
import { useReducedMotion } from "motion/react";

import type { AudioAnalysisOptions, FrequencyData } from "@core";
import { useAudioAnalysisService } from "./useAudioAnalysisService";

type UseAudioSpectrumOptions = AudioAnalysisOptions & {
  enabled: boolean;
};

export type AudioSpectrumSampler = {
  enabled: boolean;
  binCount: number;
  sample: (target: FrequencyData) => boolean;
};

export function useAudioSpectrum({
  enabled,
  fftSize = 128,
  smoothingTimeConstant = 0.86,
  minDecibels,
  maxDecibels,
}: UseAudioSpectrumOptions): AudioSpectrumSampler {
  const audio = useAudioAnalysisService();
  const reduceMotion = useReducedMotion();
  const active = enabled && reduceMotion !== true;
  const options = useMemo(
    () => ({ fftSize, smoothingTimeConstant, minDecibels, maxDecibels }),
    [fftSize, smoothingTimeConstant, minDecibels, maxDecibels],
  );

  return useMemo(
    () => ({
      enabled: active,
      binCount: audio.frequencyBinCount(fftSize),
      sample: (target: FrequencyData) =>
        active ? audio.sampleFrequencyData(target, options) : false,
    }),
    [active, audio, fftSize, options],
  );
}
