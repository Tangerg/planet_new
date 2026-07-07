// The render-side visualisation runtime (UI infra): a host that drives effects off
// the shared @shared/audio engine. Effects consume audio data + fetch their own
// cover/material and draw with their own 2D/WebGL context. Both the player bar and
// the fullscreen stage are consumers. Add a visual in effects/ (+ one registry line).
export { VisualizerCanvas } from "./VisualizerCanvas";
export type { VisualEffect, VisualEffectInstance, VisualFrame } from "./effect";
export { VISUAL_EFFECTS, DEFAULT_EFFECT_ID, effectById, wavesEffect } from "./effects";
