import {IProvider, IProvidersManager} from "../core";
import {AbstractUseableManager} from "../manager";


export class ProvidersManager extends AbstractUseableManager<IProvider> implements IProvidersManager {
    constructor() {
        super();
    }
}

export default ProvidersManager
