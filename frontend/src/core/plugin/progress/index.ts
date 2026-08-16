import { definePlugin, service } from "dougong";
import type { FormattedDuration, Progress } from "@domain/model/duration";
import { InfinityDuration } from "@domain/model/duration";
import { formatDuration, Minute, Second } from "@shared/time";
import { clamp } from "@shared/math";
import {
  AUDIO_RUNTIME,
  broadcaster,
  DURATION_CHANGED,
  POSITION_CHANGED,
  type Broadcast,
} from "../../kernel";

/** Playback position: seek. */
export const PROGRESS = service<ProgressRuntime>("planet/progress");

export class ProgressRuntime {
  /** Last whole-second emitted — position updates throttle to ~1/sec at the source. */
  private lastSecond = -1;

  constructor(
    private readonly audioElement: HTMLAudioElement,
    private readonly broadcast: Broadcast,
  ) {
    this.audioElement.addEventListener("timeupdate", this.onTimeUpdate);
    this.audioElement.addEventListener("durationchange", this.onDurationChange);
  }

  get current(): Progress {
    const duration = this.audioElement.currentTime;
    const total = this.audioElement.duration;
    const percent = Number.isFinite(total) && total > 0 ? Math.floor((duration / total) * 100) : 0;
    return {
      duration,
      durationFormatted: formatDuration(duration * Second, [Minute, Second]),
      percent,
    };
  }

  get duration(): FormattedDuration {
    const total = this.audioElement.duration;
    if (!Number.isFinite(total)) {
      return InfinityDuration;
    }
    return {
      duration: total,
      durationFormatted: formatDuration(total * Second, [Minute, Second]),
    };
  }

  seek = (v: number): void => {
    const total = this.audioElement.duration;
    if (!Number.isFinite(total)) {
      return;
    }
    const t = (v / 100) * total;
    this.audioElement.currentTime = clamp(0, total, t);
    // Force the next timeupdate to emit even within the same second as the seek.
    this.lastSecond = -1;
  };

  release(): void {
    this.audioElement.removeEventListener("timeupdate", this.onTimeUpdate);
    this.audioElement.removeEventListener("durationchange", this.onDurationChange);
  }

  private onTimeUpdate = (): void => {
    // Throttle to one emit per whole second at the source, so the formatted
    // Progress is built once/sec instead of ~4×/sec (the timeupdate cadence).
    const sec = Math.floor(this.audioElement.currentTime);
    if (sec === this.lastSecond) return;
    this.lastSecond = sec;
    this.broadcast(POSITION_CHANGED, this.current);
  };

  private onDurationChange = (): void => {
    this.broadcast(DURATION_CHANGED, this.duration);
  };
}

export const progressPlugin = definePlugin({
  name: "planet.progress",
  requires: { audio: AUDIO_RUNTIME },
  provides: { progress: PROGRESS },
  setup(ctx) {
    const runtime = new ProgressRuntime(ctx.audio.audioElement, broadcaster(ctx));
    ctx.cleanup(() => runtime.release());
    return { progress: runtime };
  },
});
