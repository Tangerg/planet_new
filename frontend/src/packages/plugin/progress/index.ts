import {Plugin} from "../../core/plugin";
import type {Progress as ProgressModel, Duration} from "../../model/duration";
import {InfinityDuration} from "../../model/duration";
import {formatDuration, Millisecond, Minute, Second} from "../../shared-utils/time";
import {getNumberInRange} from "../../shared-utils/math";


declare module "../../core/event" {
    interface PlanetEventMap {
        play_time_seek: number;
        track_duration_changed: Duration
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
    }

    afterInstall() {
        super.afterInstall();
        this.context.audioElement.addEventListener("timeupdate", this.onTimeUpdate.bind(this))
        this.context.audioElement.addEventListener("durationchange", this.onDurationChange.bind(this))
        this.context.hooks.on("play_time_seek", this.seek, this)
        this.onDurationChange()
        this.onTimeUpdate()
    }

    get current(): ProgressModel {
        const rv = {} as ProgressModel
        rv.duration = this.context.audioElement.currentTime
        rv.durationFormatted = formatDuration(rv.duration * Second, [Minute, Second])
        rv.percent = Math.floor(rv.duration / this.context.audioElement.duration * 100)
        return rv
    }

    get duration(): Duration {
        if (this.context.audioElement.duration == Infinity) {
            return InfinityDuration
        }
        const rv = {} as Duration
        rv.duration = this.context.audioElement.duration
        rv.durationFormatted = formatDuration(rv.duration * Second, [Minute, Second])
        return rv
    }

    onTimeUpdate() {
        this.context.hooks.emit("play_time_changed", this.current)
    }

    onDurationChange(): void {
        this.context.hooks.emit("track_duration_changed", this.duration)
    }

    seek(v: number): void {
        const t = v / 100 * this.context.audioElement.duration
        if (this.context.audioElement.duration == Infinity) {
            return
        }
        this.context.audioElement.currentTime = getNumberInRange(0, this.context.audioElement.duration, t)
    }
}
