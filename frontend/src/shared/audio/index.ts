// Pure, framework-agnostic audio-reactive engine (zero deps beyond @shared/math).
// The live AnalyserNode (Web Audio I/O) lives in @core; this is the DSP + reactive
// reduction that turns its FFT bytes into values any visual can consume.
//
// The engine IS the public surface: createAudioEngine() owns the DSP primitives
// (spectrum / light-frame / lanes), so consumers reach the reactive frame through it
// and never past it. Those primitives stay module-private — imported directly by
// their own unit tests, not re-exported here.
export {
  createAudioEngine,
  resolveAudioEngineConfig,
  type AudioEngineConfig,
  type AudioReactive,
} from "./engine";
