import { Plugin, defineCapability } from "../../kernel";

export interface AnalyserPort {
  /** The shared AnalyserNode tapping the audible playback element. */
  analyser(): AnalyserNode;
}

/** Audio analyser tap over the shared playback element (visualizers, EQ, …). */
export const AUDIO_ANALYSER = defineCapability<AnalyserPort>("audio-analyser");

/**
 * Taps the shared, audible <audio> element into Web Audio for visualization.
 * Every play URL is routed through the loopback media gateway (local /media or
 * the /stream proxy), so the element is always same-origin — createMediaElement-
 * Source() can sample it without tainting or silencing playback.
 *
 * The graph is `source → analyser → destination`, so audio still reaches the
 * speakers (the element's own volume/mute apply upstream); the analyser is a
 * passive tap that follows whatever the player plays, so the spectrum is always
 * exactly in sync with what's heard. The source node is created lazily on first
 * use and lives for the element's lifetime (one per element is a hard rule).
 */
export class AudioEngine extends Plugin implements AnalyserPort {
  public static readonly id = "audio-engine";
  private node: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;

  get id(): string {
    return AudioEngine.id;
  }

  protected onInit(): void {
    this.context.registry.provide(AUDIO_ANALYSER, this);
  }

  protected onDispose(): void {
    this.source?.disconnect();
    this.node?.disconnect();
    this.source = null;
    this.node = null;
  }

  analyser(): AnalyserNode {
    if (this.node) return this.node;
    const ctx = this.context.audioContext;
    const source = ctx.createMediaElementSource(this.context.audioElement);
    const analyser = ctx.createAnalyser();
    source.connect(analyser);
    analyser.connect(ctx.destination);
    this.source = source;
    this.node = analyser;
    return analyser;
  }
}
