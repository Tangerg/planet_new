import type { AnalyserPort } from "../plugin/audio-engine";

export type FrequencyData = Uint8Array<ArrayBuffer>;

export type AudioAnalysisOptions = {
  /** Must be a power of two supported by AnalyserNode. */
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
};

const DEFAULT_FFT_SIZE = 128;

/**
 * Read-only audio analysis use case. It exposes the shared analyser probe
 * without letting UI components resolve kernel services directly. Sampling is
 * pull-based so visualizers run in their own RAF loop instead of pushing 60fps
 * data through React state, Zustand, or the event bus.
 *
 * Availability is answered by sampling, not by a second predicate: the probe can
 * fail at any frame (a stale stream, a suspended context), so a caller that
 * trusted an "is it supported" flag would still have to handle `false`.
 */
export class AudioAnalysisService {
  constructor(private readonly port: () => AnalyserPort) {}

  frequencyBinCount(fftSize = DEFAULT_FFT_SIZE): number {
    return Math.max(1, Math.floor(fftSize / 2));
  }

  sampleFrequencyData(target: FrequencyData, options: AudioAnalysisOptions = {}): boolean {
    try {
      const analyser = this.port().analyser();
      const fftSize = options.fftSize ?? DEFAULT_FFT_SIZE;
      if (analyser.fftSize !== fftSize) analyser.fftSize = fftSize;
      if (
        options.smoothingTimeConstant !== undefined &&
        analyser.smoothingTimeConstant !== options.smoothingTimeConstant
      ) {
        analyser.smoothingTimeConstant = options.smoothingTimeConstant;
      }
      if (options.minDecibels !== undefined && analyser.minDecibels !== options.minDecibels) {
        analyser.minDecibels = options.minDecibels;
      }
      if (options.maxDecibels !== undefined && analyser.maxDecibels !== options.maxDecibels) {
        analyser.maxDecibels = options.maxDecibels;
      }
      if (target.length !== analyser.frequencyBinCount) return false;

      analyser.getByteFrequencyData(target);
      return true;
    } catch {
      return false;
    }
  }
}
