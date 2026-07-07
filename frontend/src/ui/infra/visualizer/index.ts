// The shared visualisation engine (UI infra): one host that produces per-frame data
// (reactive audio + cover palette/particles), and effects that consume it — each
// drawing with its own 2D or WebGL context. Both the player bar and the fullscreen
// stage are consumers. Add a visual in effects/ (+ one registry line); nothing else.
export { VisualizerCanvas } from "./VisualizerCanvas";
export type { VisualEffect, VisualEffectInstance, VisualFrame, AudioReactive } from "./engine";
export { VISUAL_EFFECTS, DEFAULT_EFFECT_ID, effectById, wavesEffect } from "./effects";
