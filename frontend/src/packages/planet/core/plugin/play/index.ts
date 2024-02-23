import {AbstractPlugin} from "../abstract-plugin";

export const playEvents = {
    play: "play",
    pause: "pause",
    seek: "seek",

    played: "played",
    paused: "paused",
    seeked: "seeked"
}

export class Play extends AbstractPlugin {

    constructor() {
        super();
    }

    name(): string {
        return this.fullname("play")
    }

    init(): void {
        this.planet.on(playEvents.play, this.play)
        this.planet.on(playEvents.pause, this.pause)
        this.planet.on(playEvents.seek, this.seek)
    }

    async play(): Promise<void> {
        await this.planet.audioElement.play()
        this.planet.emit(playEvents.played)
    }

    pause(): void {
        this.planet.audioElement.pause()
        this.planet.emit(playEvents.paused)
    }

    seek(t: number): void {
        this.planet.audioElement.currentTime = t
        this.planet.emit(playEvents.seeked)
    }
}

export default Play

