import {Track} from "../../model/track";
import {IManager, IManageable, IUseableManager} from "./manager";
import {IPlugin} from "./plugin";

export interface IPluginManager extends IManager<IPlugin> {

}

export interface IQueue extends IUseableManager<Track> {
    previous(): void

    next(): void
}

export interface IProvider extends IManageable {
    name(): string

    playlist(id: string): Promise<Track[]>
}


export interface IProvidersManager extends IUseableManager<IProvider> {
}
