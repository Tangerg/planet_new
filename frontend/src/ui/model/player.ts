import { Volume } from "@domain/model/volume";

export type VolumeLevel = "muted" | "low" | "high";

export const VOLUME_STEP = 5;

export function volumeLevel(volume: number): VolumeLevel {
  if (Volume.of(volume).muted) return "muted";
  return volume <= 50 ? "low" : "high";
}

export function clampVolume(volume: number): number {
  return Volume.of(volume).level;
}

export function nextVolumeLevel(
  volume: number,
  direction: "up" | "down",
  step = VOLUME_STEP,
): number {
  return clampVolume(volume + (direction === "up" ? step : -step));
}

export function volumeSliderValue(volume: number): number {
  return clampVolume(volume) / 100;
}

export function volumeFromSliderValue(value: number | undefined): number {
  return clampVolume((value ?? 0) * 100);
}

export function likedShortcutTarget(currentId: string | undefined): string | null {
  return currentId || null;
}

export function repeatTooltip(repeat: boolean, repeatOne: boolean): string {
  if (!repeat) return "player.enableRepeat";
  return repeatOne ? "player.disableRepeat" : "player.enableRepeatOne";
}
