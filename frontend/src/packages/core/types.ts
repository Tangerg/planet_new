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
    beforeInstall(): void

    install(ctx: IContext): void

    afterInstall(): void

    beforeUninstall(): void

    uninstall(): void

    afterUninstall(): void
}

export interface IPlanet<> {
    get hooks(): IEventEmitter<PlanetEventMap>
}
