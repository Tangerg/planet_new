import {Plugin} from "../plugin";

export const playEvents = {
    play: "play",
    pause: "pause",
    seek: "seek",

    played: "played",
    paused: "paused",
    seeked: "seeked"
}

export class Play extends Plugin {

    constructor() {
        super();
    }

    name(): string {
        return this.fullname("play")
    }

    init(): void {
        this.planet.eventEmitter.on(playEvents.play, this.play)
        this.planet.eventEmitter.on(playEvents.pause, this.pause)
        this.planet.eventEmitter.on(playEvents.seek, this.seek)
    }

    async play(): Promise<void> {
        await this.planet.audioElement.play()
        this.planet.eventEmitter.emit(playEvents.played)
    }

    pause(): void {
        this.planet.audioElement.pause()
        this.planet.eventEmitter.emit(playEvents.paused)
    }

    seek(t: number): void {
        this.planet.audioElement.currentTime = t
        this.planet.eventEmitter.emit(playEvents.seeked)
    }
}

export default Play

