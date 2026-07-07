// Pure, framework-agnostic audio-reactive engine (zero deps beyond @shared/math).
// The live AnalyserNode (Web Audio I/O) lives in @core; this is the DSP + reactive
// reduction that turns its FFT bytes into values any visual can consume. Primary
// surface: createAudioEngine(). Primitives are exported too for tests / advanced use.
export {
  createAudioEngine,
  resolveAudioEngineConfig,
  audioReactive,
  initialReactiveState,
  DEFAULT_AUDIO_ENGINE_CONFIG,
  type AudioEngine,
  type AudioEngineConfig,
  type AudioReactive,
  type ReactiveState,
} from "./engine";
export {
  spectrumFrame,
  adaptiveGain,
  smoothSpectrum,
  smoothSignalValue,
  normalizeFftByte,
  beatEnvelope,
  initialAdaptiveGain,
  assertBandCount,
  FFT_BYTE_MAX,
  type SpectrumFrame,
  type AdaptiveGainOptions,
  type AdaptiveGainState,
} from "./spectrum";
export {
  nextAudioLightFrame,
  initialAudioLightFrameState,
  type AudioLightFrame,
  type AudioLightFrameState,
} from "./frame";
export { audioLanes, type AudioLane } from "./lanes";
