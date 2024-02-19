import {IPlanet, IPlanetPlugin} from "../planet";

export abstract class Plugin implements IPlanetPlugin {

    protected planet!: IPlanet

    protected fullname(name: string): string {
        return `planet:plugin:${name}`
    }

    abstract init(): void

    abstract name(): string

    install(p: IPlanet): void {
        this.planet = p
        this.init()
    }

}
