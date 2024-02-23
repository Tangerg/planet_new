import {IPlanet} from "./planet";
import {IManageable} from "./manager";

export interface IPlugin extends IManageable {
    name(): string

    install(p: IPlanet): void

    uninstall(): void
}

export interface IPlanetOptions {
}
