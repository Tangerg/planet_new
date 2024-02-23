import {Track} from "../model/track";
import AbstractManager, {IManageable, IManager} from "../manager";


export interface IProvider extends IManageable {
    name(): string

    playlist(id: string): Promise<Track[]>
}

export interface IProvidersManager extends IManager<IProvider> {
}

export class ProvidersManager extends AbstractManager<IProvider> implements IProvidersManager {
    constructor() {
        super();
    }
}

export default ProvidersManager
