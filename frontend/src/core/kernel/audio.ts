import { definePlugin, service } from "dougong";

/**
 * Browser-audio resources required by the kernel plugins. Concrete DOM/Web
 * Audio construction belongs to an outer infrastructure adapter; the kernel
 * only receives the finished runtime.
 */
export interface AudioRuntimePort {
  readonly audioElement: HTMLAudioElement;
  readonly audioContext: AudioContext;
  createAnalysisElement(): HTMLAudioElement;
  dispose(): void;
}

/** The shared audible element + Web Audio context every player plugin drives. */
export const AUDIO_RUNTIME = service<AudioRuntimePort>("planet/audio-runtime");

/**
 * Publishes the injected audio runtime and owns its release. Ownership is a
 * Lifetime cleanup rather than a special case in the host: whether the graph
 * stops normally or a sibling's setup rolls the transaction back, the element
 * and the AudioContext are released exactly once.
 */
export const audioRuntimePlugin = definePlugin({
  name: "planet.audio-runtime",
  provides: { audio: AUDIO_RUNTIME },
  setup(ctx, runtime: AudioRuntimePort) {
    ctx.cleanup(() => runtime.dispose());
    return { audio: runtime };
  },
});
