import { Plugin } from "../../kernel/plugin";
import { defineCapability } from "../../kernel";
import type { FormattedDuration, Progress } from "@domain/model/duration";
import { InfinityDuration } from "@domain/model/duration";
import { formatDuration, Minute, Second } from "@shared/time";
import { clamp } from "@shared/math";

declare module "../../kernel/event" {
  interface PlanetEventMap {
    "progress:duration-changed": FormattedDuration;
    "progress:position-changed": Progress;
  }
}

/** Playback position: seek. */
export const PROGRESS = defineCapability<ProgressRuntime>("progress");

export class ProgressRuntime extends Plugin {
  public static readonly id = "progress";

  /** Last whole-second emitted — position updates throttle to ~1/sec at the source. */
  private lastSecond = -1;

  get id(): string {
    return ProgressRuntime.id;
  }

  protected onDispose(): void {
    this.context.audioElement.removeEventListener("timeupdate", this.onTimeUpdate);
    this.context.audioElement.removeEventListener("durationchange", this.onDurationChange);
  }

  protected onInit(): void {
    this.context.registry.provide(PROGRESS, this);
    this.context.audioElement.addEventListener("timeupdate", this.onTimeUpdate);
    this.context.audioElement.addEventListener("durationchange", this.onDurationChange);
    this.onDurationChange();
    this.onTimeUpdate();
  }

  get current(): Progress {
    const duration = this.context.audioElement.currentTime;
    const total = this.context.audioElement.duration;
    const percent = Number.isFinite(total) && total > 0 ? Math.floor((duration / total) * 100) : 0;
    return {
      duration,
      durationFormatted: formatDuration(duration * Second, [Minute, Second]),
      percent,
    };
  }

  get duration(): FormattedDuration {
    const total = this.context.audioElement.duration;
    if (!Number.isFinite(total)) {
      return InfinityDuration;
    }
    return {
      duration: total,
      durationFormatted: formatDuration(total * Second, [Minute, Second]),
    };
  }

  onTimeUpdate = (): void => {
    // Throttle to one emit per whole second at the source, so the formatted
    // Progress is built once/sec instead of ~4×/sec (the timeupdate cadence).
    const sec = Math.floor(this.context.audioElement.currentTime);
    if (sec === this.lastSecond) return;
    this.lastSecond = sec;
    this.context.hooks.emit("progress:position-changed", this.current);
  };

  onDurationChange = (): void => {
    this.context.hooks.emit("progress:duration-changed", this.duration);
  };

  seek = (v: number): void => {
    const total = this.context.audioElement.duration;
    if (!Number.isFinite(total)) {
      return;
    }
    const t = (v / 100) * total;
    this.context.audioElement.currentTime = clamp(0, total, t);
    // Force the next timeupdate to emit even within the same second as the seek.
    this.lastSecond = -1;
  };
}
