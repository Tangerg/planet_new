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

export type AudioAnalysisSourceResolver = (playUrl: string) => string | Promise<string>;

const DEFAULT_FFT_SIZE = 128;
const identitySource: AudioAnalysisSourceResolver = (playUrl) => playUrl;

/**
 * Read-only audio analysis use case. It exposes the shared analyser tap without
 * letting UI components resolve kernel plugins directly. Sampling is pull-based
 * so visualizers can run in their own RAF loop instead of pushing 60fps data
 * through React state, Zustand, or the event bus.
 */
export class AudioAnalysisService {
  constructor(
    private readonly planet: Planet,
    private readonly resolveSource: AudioAnalysisSourceResolver = identitySource,
  ) {}

  get supported(): boolean {
    return this.planet.resolve(AUDIO_ANALYSER) !== null;
  }

  frequencyBinCount(fftSize = DEFAULT_FFT_SIZE): number {
    return Math.max(1, Math.floor(fftSize / 2));
  }

  async useSource(playUrl: string | undefined): Promise<boolean> {
    const port = this.planet.resolve(AUDIO_ANALYSER);
    if (!port) return false;
    if (!playUrl) {
      port.stop();
      return false;
    }

    try {
      const source = await this.resolveSource(playUrl);
      if (!source) {
        port.stop();
        return false;
      }
      await port.setSource(source);
      return true;
    } catch {
      port.stop();
      return false;
    }
  }

  stop(): void {
    this.planet.resolve(AUDIO_ANALYSER)?.stop();
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
