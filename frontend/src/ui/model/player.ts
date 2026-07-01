export type VolumeLevel = "muted" | "low" | "high";

export function effectiveDuration(durationSec: number, fallbackSec: number | undefined): number {
  return durationSec > 0 ? durationSec : fallbackSec || 1;
}

export function playbackPosition(
  positionSec: number,
  durationSec: number,
  scrubSec: number | null,
): number {
  return scrubSec ?? Math.min(positionSec, durationSec);
}

export function volumeLevel(volume: number): VolumeLevel {
  if (volume === 0) return "muted";
  return volume <= 50 ? "low" : "high";
}

export function repeatTooltip(repeat: boolean, repeatOne: boolean): string {
  if (!repeat) return "Enable repeat";
  return repeatOne ? "Disable repeat" : "Enable repeat one";
}
