import { useMemo } from "react";
import { useReducedMotion } from "motion/react";

import type { AudioAnalysisOptions, FrequencyData } from "@core";
import { useAudioAnalysisService } from "./useAudioAnalysisService";

type UseAudioSpectrumOptions = AudioAnalysisOptions & {
  enabled: boolean;
  playUrl?: string;
};

export type AudioSpectrumSampler = {
  enabled: boolean;
  binCount: number;
  sample: (target: FrequencyData) => boolean;
};

/**
 * Imperative spectrum sampler for canvas visualizers. It is intentionally not a
 * React state hook: callers pull data inside requestAnimationFrame and draw
 * directly, keeping 60fps visual data out of the app state graph.
 *
 * The analyser passively taps the shared player, so there's no source to load
 * or tear down here — `playUrl` only gates the sampler on/off (idle when nothing
 * is playing); the first `sample()` lazily wires the tap.
 */
export function useAudioSpectrum({
  enabled,
  playUrl,
  fftSize = 128,
  smoothingTimeConstant = 0.86,
  minDecibels,
  maxDecibels,
}: UseAudioSpectrumOptions): AudioSpectrumSampler {
  const audio = useAudioAnalysisService();
  const reduceMotion = useReducedMotion();
  const active = enabled && reduceMotion !== true && !!playUrl;
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
