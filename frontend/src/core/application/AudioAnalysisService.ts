import type { Planet } from "../kernel";
import { AUDIO_ANALYSER } from "../plugin/audio-engine";

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
 * Read-only audio analysis use case. It exposes the shared analyser tap over the
 * audible playback element without letting UI components resolve kernel plugins
 * directly. There is no source to manage — the analyser passively follows the
 * player — so callers only sample. Sampling is pull-based so visualizers run in
 * their own RAF loop instead of pushing 60fps data through React state, Zustand,
 * or the event bus.
 */
export class AudioAnalysisService {
  constructor(private readonly planet: Planet) {}

  get supported(): boolean {
    return this.planet.resolve(AUDIO_ANALYSER) !== null;
  }

  frequencyBinCount(fftSize = DEFAULT_FFT_SIZE): number {
    return Math.max(1, Math.floor(fftSize / 2));
  }

  sampleFrequencyData(target: FrequencyData, options: AudioAnalysisOptions = {}): boolean {
    const port = this.planet.resolve(AUDIO_ANALYSER);
    if (!port) return false;

    try {
      const analyser = port.analyser();
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
