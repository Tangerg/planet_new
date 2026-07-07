import type { AudioLightFrame, SpectralLightColors } from "@/model/audio-visualization";
import type { CoverParticles } from "@/model/stage-particles";

/** Everything an effect needs to paint one frame. The host owns the canvas, the
 *  audio frame (→ audioLanes), the cover palette, and the cover particle cloud;
 *  effects are otherwise self-contained (their own mutable state lives in the
 *  instance returned by `create`). */
export type StageFrameInput = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
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
  draw(input: StageFrameInput): void;
  dispose?(): void;
};

/** A selectable fullscreen visualisation. `create` returns a fresh instance so each
 *  effect keeps its own per-particle / per-lane state across frames. */
export type StageEffect = {
  id: string;
  /** i18n key for the switcher label. */
  labelKey: string;
  create(): StageEffectInstance;
};
