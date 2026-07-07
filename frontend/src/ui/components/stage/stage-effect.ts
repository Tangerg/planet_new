import type { AudioLightFrame, SpectralLightColors } from "@/model/audio-visualization";
import type { CoverParticles } from "@/model/stage-particles";

/** Everything an effect needs to paint one frame. The host owns sizing, the audio
 *  frame (→ audioLanes), the cover palette, and the cover particle cloud; the effect
 *  acquires its OWN drawing context (2D or WebGL) from the canvas in `create`, so
 *  sizes are given in CSS px + dpr rather than a shared context. */
export type StageFrameInput = {
  width: number;
  height: number;
  dpr: number;
  timeSec: number;
  /** Seconds since the previous frame (clamped), for frame-rate-independent motion. */
  dtSec: number;
  playing: boolean;
  frame: AudioLightFrame;
  colors: SpectralLightColors;
  /** The current cover as a particle cloud, or null while it loads / can't be read. */
  particles: CoverParticles | null;
};

export type StageEffectInstance = {
  /** Backing store was resized; re-set the viewport / transform. */
  resize?(width: number, height: number, dpr: number): void;
  draw(input: StageFrameInput): void;
  dispose?(): void;
};

/** A selectable fullscreen visualisation. `create` receives a fresh canvas (one per
 *  effect, so 2D and WebGL contexts never collide) and returns an instance that
 *  keeps its own per-frame state. */
export type StageEffect = {
  id: string;
  /** i18n key for the switcher label. */
  labelKey: string;
  create(canvas: HTMLCanvasElement): StageEffectInstance;
};
