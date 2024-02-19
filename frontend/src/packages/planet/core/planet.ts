import {EventEmitter, IEventEmitter} from "../event-emitter";
import {Track} from "../model/track";
import {IProvidersManager, ProvidersManager} from "../provider";
import {warn} from "../../shared-utils/debug";


export interface IPlanetPlugin {
    name(): string

    install(p: IPlanet): void
}

export interface IPlanetOptions {
}

export interface IPlanet extends IEventEmitter {
    readonly audioElement: HTMLAudioElement
    readonly options: IPlanetOptions
    readonly providersManager: IProvidersManager

    applyTracks(Tracks: Track[]): void

    addTrack(t: Track): void

    removeTrack(t: Track): void

    clearTracks(): void

    changePlayMode(): void

    prevTrack(): void

    nextTrack(): void

    selectTrack(t: Track): void

    play(): void

    pause(): void

    seek(t: number): void

    changeVolume(v: number): void

    mute(): void
}

export class Planet extends EventEmitter implements IPlanet {
    static plugins: IPlanetPlugin[] = []

    readonly audioElement: HTMLAudioElement;
    readonly plugins: IPlanetPlugin[]
    readonly options: IPlanetOptions
    readonly providersManager: IProvidersManager

    static use(plugin: IPlanetPlugin) {
        const installed = Planet.plugins.some(
            p => p.name() === plugin.name()
        )
        if (installed) {
            return Planet
        }
        Planet.plugins.push(plugin)
        return Planet
    }

    constructor(options: IPlanetOptions = {}) {
        super();
        this.plugins = []
        this.providersManager = new ProvidersManager()
        this.options = options
        this.audioElement = new Audio()
        this.init()
    }


    private init() {
        Planet.plugins.forEach(plugin => {
            plugin.install(this)
            this.plugins.push(plugin)
        })
        if (!Boolean(this.providersManager.getProvider())) {
            const err = warn(`at least one provider is required`)
            throw new Error(err)
        }
    }

    applyTracks(Tracks: Track[]): void {
        throw new Error("Method not implemented.");
    }

    addTrack(t: Track): void {
        throw new Error("Method not implemented.");
    }

    removeTrack(t: Track): void {
        throw new Error("Method not implemented.");
    }

    clearTracks(): void {
        throw new Error("Method not implemented.");
    }

    changePlayMode(): void {
        throw new Error("Method not implemented.");
    }

    prevTrack(): void {
        throw new Error("Method not implemented.");
    }

    nextTrack(): void {
        throw new Error("Method not implemented.");
    }

    selectTrack(t: Track): void {
        throw new Error("Method not implemented.");
    }

    play(): void {
        throw new Error("Method not implemented.");
    }

    pause(): void {
        throw new Error("Method not implemented.");
    }

    seek(t: number): void {
        throw new Error("Method not implemented.");
    }

    changeVolume(v: number): void {
        throw new Error("Method not implemented.");
    }

    mute(): void {
        throw new Error("Method not implemented.");
    }


}

export default Planet
