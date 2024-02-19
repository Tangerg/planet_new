import {Plugin} from "../plugin";

export const volumeEvents = {
    mute: "mute",
    changeVolume: "change-volume",

    volumeChanged: "volume-changed"
}

export class Volume extends Plugin {
    private preVolume: number = 0


    name(): string {
        return this.fullname("volume")
    }

    init() {
        this.planet.on(volumeEvents.changeVolume, this.volume)
        this.planet.on(volumeEvents.mute, this.mute)
    }

    volume(v: number): void {
        this.preVolume = this.planet.audioElement.volume
        this.planet.audioElement.volume = v
        this.planet.emit(volumeEvents.volumeChanged, v)
    }

    mute(): void {
        if (this.preVolume != 0) {
            this.volume(0)
        } else {
            this.volume(this.preVolume)
        }
    }
}

export default Volume
