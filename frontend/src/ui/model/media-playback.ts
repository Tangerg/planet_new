import { clamp } from "@shared/math";
import { formatDuration, Minute, Second } from "@shared/time";

export function effectiveMediaDuration(
  durationSec: number,
  fallbackSec: number | undefined,
): number {
  if (durationSec > 0) return durationSec;
  return fallbackSec && fallbackSec > 0 ? fallbackSec : 1;
}

export function mediaPlaybackPosition(
  positionSec: number,
  durationSec: number,
  overrideSec: number | null | undefined,
): number {
  return overrideSec ?? clamp(0, Math.max(0, durationSec), positionSec);
}

export function mediaProgress(positionSec: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  return clamp(0, 1, positionSec / durationSec);
}

export function mediaSeekPercent(positionSec: number, durationSec: number): number {
  return mediaProgress(positionSec, durationSec) * 100;
}

export type MediaTimelinePreview = {
  x: number;
  positionSec: number;
};

export function mediaTimelinePreview({
  clientX,
  durationSec,
  left,
  width,
}: {
  clientX: number;
  durationSec: number;
  left: number;
  width: number;
}): MediaTimelinePreview {
  const x = clamp(0, Math.max(0, width), clientX - left);
  return {
    x,
    positionSec:
      width > 0 ? mediaPlaybackPosition((x / width) * durationSec, durationSec, undefined) : 0,
  };
}

export function formatMediaTime(valueSec: number): string {
  return formatDuration(Math.floor(Math.max(0, valueSec)) * Second, [Minute, Second]);
}

export function formatCompactMediaTime(valueSec: number): string {
  const safe = Math.floor(Math.max(0, valueSec));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}
