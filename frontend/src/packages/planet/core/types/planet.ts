import {IEventEmitter} from "./event";
import {IPluginManager, IProvidersManager} from "./manager-trait";
import {IPlanetOptions} from "./plugin";
import {EventMap} from "../event";

export type Playmode = "sequence" | "queue" | "repeat" | "shuffle"

export interface IPlanet {
    readonly audioElement: HTMLAudioElement;
    readonly options: IPlanetOptions
    readonly eventEmitter: IEventEmitter<EventMap>
    readonly pluginManager: IPluginManager
    readonly providersManager: IProvidersManager
}

