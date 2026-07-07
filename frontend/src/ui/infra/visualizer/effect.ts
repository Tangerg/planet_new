import type { AudioEngineConfig, AudioReactive } from "@shared/audio";

/**
 * Everything an effect consumes for one frame: the reactive audio (from the shared
 * audio engine), sizing/timing, and the render context it may fetch its own material
 * from (cover URL + theme accent). Cover pixels / palette / lyrics are NOT here — an
 * effect loads what it wants from `image` (see cover.ts). The engine stays audio-only.
 */
export type VisualFrame = {
  width: number;
  height: number;
  dpr: number;
  timeSec: number;
  /** Seconds since the previous frame (clamped), for frame-rate-independent motion. */
  dtSec: number;
  playing: boolean;
  audio: AudioReactive;
  /** Current cover URL — an effect may load/sample it (via cover.ts) if it wants. */
  image?: string;
  /** Theme accent — a palette fallback when there's no cover. */
  accent: string;
};

export type VisualEffectInstance = {
  /** Backing store was resized; re-set the viewport / transform. */
  resize?(width: number, height: number, dpr: number): void;
  draw(frame: VisualFrame): void;
  dispose?(): void;
};

/**
 * A selectable visual. `create` receives a fresh canvas (so 2D and WebGL contexts
 * never collide) and returns an instance that draws one VisualFrame at a time.
 * Adding a visual is: a create() consuming the frame + one registry entry. `tuning`
 * shapes the audio the engine feeds it (gentle vs agitated).
 */
export type VisualEffect = {
  id: string;
  /** i18n key for the switcher label. */
  labelKey: string;
  /** Optional per-effect audio-engine tuning (merged over DEFAULT_AUDIO_ENGINE_CONFIG). */
  tuning?: Partial<AudioEngineConfig>;
  create(canvas: HTMLCanvasElement): VisualEffectInstance;
};
