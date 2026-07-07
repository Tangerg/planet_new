// Public visualisation API for the UI layer: the frame state machine, the pure
// lane logic, and the cover palette. The spectrum/AGC module (audio-spectrum) is an
// internal detail of audio-light-frame and is intentionally not re-exported here.
export type { AudioLightFrame, AudioLightFrameState } from "./audio-light-frame";
export { initialAudioLightFrameState, nextAudioLightFrame } from "./audio-light-frame";
export type { AudioLane } from "./audio-lanes";
export { audioLanes } from "./audio-lanes";
export type { HslColor, SpectralLightColors } from "./audio-light-palette";
export { hsla, spectralLightColors } from "./audio-light-palette";
