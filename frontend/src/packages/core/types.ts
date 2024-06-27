import {IEventEmitter} from "../event";
import {IManageable} from "../manager";
import {PlanetEventMap} from "./event";
import {IDisposeable} from "../types";

export interface IContext {
    get audioElement(): HTMLAudioElement;

    get audioContext(): AudioContext;

    get hooks(): IEventEmitter<PlanetEventMap>
}

export interface IPlugin extends IManageable, IDisposeable {
    install(ctx: IContext): void

    uninstall(): void
}

export interface IPlanet<> {
    get hooks(): IEventEmitter<PlanetEventMap>
}
