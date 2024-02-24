import {IProvider, IProvidersManager} from "../types";
import {UseableManager} from "./manager";


export class ProvidersManager extends UseableManager<IProvider> implements IProvidersManager {
    constructor() {
        super();
    }
}

export default ProvidersManager
