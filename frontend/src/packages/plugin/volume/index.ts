import {Plugin} from "../../core";
import {getNumberInRange} from "../../shared-utils/math";

export class Volume extends Plugin {
    public static id: string = "volume";
    private preVolume = 0

    get id(): string {
        return Volume.id;
    }

    dispose(): void {
        this.preVolume = 0;
    }

    change(v: number): void {
        this.preVolume = this.context.audioElement.volume
        this.context.audioElement.volume = getNumberInRange(0, 1, v)
    }

    muteOrUnmute() {
        if (this.preVolume === 0) {
            this.change(this.preVolume)
        }
        this.change(0)
    }
}

export default Volume
