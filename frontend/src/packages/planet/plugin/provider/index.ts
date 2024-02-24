import {Plugin} from "../plugin";
import {IProvider} from "../../core";

export class Provider extends Plugin {
    private readonly providers: IProvider[]

    constructor(ps: IProvider[]) {
        super();
        this.providers = []
        this.providers.push(...ps)
    }

    name(): string {
        return this.fullname("provider")
    }

    init(): void {
        this.planet.providersManager.apply(this.providers, this.providers[0])
    }


}

export default Provider
