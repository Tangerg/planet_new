import {IEventEmitter} from "./event";
import {IPluginManager, IProvidersManager} from "./manager-trait";
import {IPlanetOptions} from "./plugin";

export type Playmode = "sequence" | "queue" | "repeat" | "shuffle"

export interface IPlanet extends IEventEmitter {
    readonly audioElement: HTMLAudioElement;
    readonly options: IPlanetOptions
    readonly eventEmitter: IEventEmitter
    readonly pluginManager: IPluginManager
    readonly providersManager: IProvidersManager
}

