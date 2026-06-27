import { Plugin, defineCapability } from "../../kernel";

export interface AnalyserPort {
  /** The shared AnalyserNode tapping playback audio (lazily wired on first call). */
  analyser(): AnalyserNode;
}

/** Tap into the playback audio graph (visualizers, equalizers, …). */
export const AUDIO_ANALYSER = defineCapability<AnalyserPort>("audio-analyser");

/**
 * Owns the shared Web Audio graph tap. `createMediaElementSource` may be called
 * at most once per <audio>, so a single plugin owns it and hands the AnalyserNode
 * to any consumer (visualizer / EQ).
 *
 * The graph is wired LAZILY on the first analyser() call: until something asks,
 * the element plays straight to the device untouched, so mounting this plugin is
 * inert and cannot affect playback. Once tapped, source → analyser → destination
 * keeps audio audible. This is the seam; no visualizer consumes it yet.
 */
export class AudioEngine extends Plugin implements AnalyserPort {
  public static readonly id = "audio-engine";
  private node: AnalyserNode | null = null;

  get id(): string {
    return AudioEngine.id;
  }

  protected onInit(): void {
    this.context.registry.provide(AUDIO_ANALYSER, this);
  }

  protected onDispose(): void {
    this.node?.disconnect();
    this.node = null;
  }

  analyser(): AnalyserNode {
    if (this.node) return this.node;
    const ctx = this.context.audioContext;
    const source = ctx.createMediaElementSource(this.context.audioElement);
    const analyser = ctx.createAnalyser();
    source.connect(analyser);
    // Keep audio audible: the element now routes through the graph, so the tap
    // must forward to the device.
    analyser.connect(ctx.destination);
    if (ctx.state === "suspended") void ctx.resume();
    this.node = analyser;
    return analyser;
  }
}
