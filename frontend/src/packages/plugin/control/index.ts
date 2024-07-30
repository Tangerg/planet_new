import {Plugin} from "../../core";

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
}

export default Control
