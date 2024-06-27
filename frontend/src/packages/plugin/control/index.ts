import {Plugin} from "../../core";
import {getNumberInRange} from "../../shared-utils/math";

export class Control extends Plugin {
    public static id: string = "control";
    get id(): string {
        return Control.id;
    }

    dispose(): void {
        this.stop()
    }

    async play(): Promise<void> {
        await this.context.audioElement.play()
    }

    pause(): void {
        this.context.audioElement.pause()
    }

    stop(): void {
        this.pause()
        this.context.audioElement.src = ""
    }

    seek(t: number): void {
        if (this.context.audioElement.duration == Infinity) {
            return
        }
        this.context.audioElement.currentTime = getNumberInRange(0, this.context.audioElement.duration, t)
    }

}

export default Control
