/**
 * The kernel is dougong's Host plus the contracts this application composes on
 * top of it: the audio runtime it injects, and the facts its plugins exchange.
 * Plugin authoring (`definePlugin`, `service`, `extensionPoint`) comes straight
 * from the library — there is no wrapper to re-learn.
 */
export { AUDIO_RUNTIME, audioRuntimePlugin, type AudioRuntimePort } from "./audio";
export { kernelLogger } from "./logger";
export * from "./events";
