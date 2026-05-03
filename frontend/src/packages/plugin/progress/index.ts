import {Plugin} from "../../core/plugin";
import type {Progress as ProgressModel, FormattedDuration} from "../../model/duration";
import {InfinityDuration} from "../../model/duration";
import {formatDuration, Minute, Second} from "../../shared-utils/time";
import {getNumberInRange} from "../../shared-utils/math";


declare module "../../core/event" {
    interface PlanetEventMap {
        play_time_seek: number;
        track_duration_changed: FormattedDuration
        play_time_changed: ProgressModel
    }
}

export class Progress extends Plugin {
    public static readonly id = "Progress"

    get id(): string {
        return Progress.id;
    }

    dispose(): void {
        this.context.audioElement.removeEventListener("timeupdate", this.onTimeUpdate)
        this.context.audioElement.removeEventListener("durationchange", this.onDurationChange)
        this.context.hooks.off("play_time_seek", this.seek)
    }

    protected onInit(): void {
        this.context.audioElement.addEventListener("timeupdate", this.onTimeUpdate)
        this.context.audioElement.addEventListener("durationchange", this.onDurationChange)
        this.context.hooks.on("play_time_seek", this.seek, this)
        this.onDurationChange()
        this.onTimeUpdate()
    }

    get current(): ProgressModel {
        const duration = this.context.audioElement.currentTime
        const total = this.context.audioElement.duration
        const percent = Number.isFinite(total) && total > 0
            ? Math.floor(duration / total * 100)
            : 0
        return {
            duration,
            durationFormatted: formatDuration(duration * Second, [Minute, Second]),
            percent,
        }
    }

    get duration(): FormattedDuration {
        const total = this.context.audioElement.duration
        if (!Number.isFinite(total)) {
            return InfinityDuration
        }
        return {
            duration: total,
            durationFormatted: formatDuration(total * Second, [Minute, Second]),
        }
    }

    onTimeUpdate = (): void => {
        this.context.hooks.emit("play_time_changed", this.current)
    }

    onDurationChange = (): void => {
        this.context.hooks.emit("track_duration_changed", this.duration)
    }

    seek = (v: number): void => {
        const total = this.context.audioElement.duration
        if (!Number.isFinite(total)) {
            return
        }
        const t = v / 100 * total
        this.context.audioElement.currentTime = getNumberInRange(0, total, t)
    }
}
