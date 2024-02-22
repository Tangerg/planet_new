import {IPlanet, IPlanetPlugin} from "../planet";
import {warn} from "../../../shared-utils/debug";

export abstract class Plugin implements IPlanetPlugin {
    private installed: boolean = false
    protected planet!: IPlanet

    protected fullname(name: string): string {
        return `planet:plugin:${name}`
    }

    abstract init(): void

    abstract name(): string

    install(p: IPlanet): void {
        if (this.installed) {
            warn(`the plugin ${this.name()} should be install only once`)
            return
        }
        this.planet = p
        this.init()
        this.installed = true
    }

    uninstall(): void {

    }
}
