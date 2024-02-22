import {Plugin} from "../planet/core";
import {IProvider} from "../planet/provider";
import QQMusic from "./QQMusic";
import NeteaseCloudMusic from "./NeteaseCloudMusic";
import Spotify from "./Spotify";
import YoutubeMusic from "./YoutubeMusic";

export class Provider extends Plugin {
    private readonly providers: IProvider[]

    constructor() {
        super();
        this.providers = []
        this.providers.push(
            new NeteaseCloudMusic(),
            new QQMusic(),
            new Spotify(),
            new YoutubeMusic()
        )
    }

    name(): string {
        return this.fullname("provider")
    }

    init(): void {
        this.planet.providersManager.apply(this.providers, this.providers[0])
    }


}

export default Provider
