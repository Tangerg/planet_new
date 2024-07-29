import {Plugin} from "../../core/plugin";
import type {Progress as ProgressModel, Duration} from "../../model/progress";
import {InfinityDuration} from "../../model/progress";
import {formatDurationSeconds} from "../../shared-utils/time";
import {IContext} from "../../core";
import {getNumberInRange} from "../../shared-utils/math";

export class Progress extends Plugin {
    public static readonly id = "Progress"

    get id(): string {
        return Progress.id;
    }

    dispose(): void {
        this.context.audioElement.removeEventListener("timeupdate", this.onTimeUpdate)
        this.context.audioElement.removeEventListener("durationchange", this.onDurationChange)
    }

    install(ctx: IContext) {
        super.install(ctx);
        this.context.audioElement.addEventListener("timeupdate", this.onTimeUpdate)
        this.context.audioElement.addEventListener("durationchange", this.onDurationChange)
    }

    afterInstall() {
        super.afterInstall();
        this.onDurationChange()
        this.onTimeUpdate()
    }

    get current(): ProgressModel {
        const rv = {} as ProgressModel
        rv.duration = this.context.audioElement.currentTime
        rv.durationFormatted = formatDurationSeconds(rv.duration)
        rv.percent = Math.floor(rv.duration / this.context.audioElement.duration) * 100
        return rv
    }

    get duration(): Duration {
        if (this.context.audioElement.duration == Infinity) {
            return InfinityDuration
        }
        const rv = {} as Duration
        rv.duration = this.context.audioElement.duration
        rv.durationFormatted = formatDurationSeconds(rv.duration)
        return rv
    }

    onTimeUpdate() {

    }

    onDurationChange(): void {

    }

    seek(t: number): void {
        if (this.context.audioElement.duration == Infinity) {
            return
        }
        this.context.audioElement.currentTime = getNumberInRange(0, this.context.audioElement.duration, t)
    }

}
