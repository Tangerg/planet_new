import type { AudioEngineConfig, AudioReactive } from "@shared/audio";

export type VisualFrame = {
  width: number;
  height: number;
  dpr: number;
  timeSec: number;
  dtSec: number;
  playing: boolean;
  audio: AudioReactive;
  image?: string;
  accent: string;
};

export type VisualEffectInstance = {
  resize?(width: number, height: number, dpr: number): void;
  draw(frame: VisualFrame): void;
  dispose?(): void;
};

export type VisualEffect = {
  id: string;
  labelKey: string;
  tuning?: Partial<AudioEngineConfig>;
  create(canvas: HTMLCanvasElement): VisualEffectInstance;
};
