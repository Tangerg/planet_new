import {
    IEventEmitter,
    IPlanet,
    IPlanetOptions,
    IPlugin,
    IPluginManager,
    IProvidersManager,
} from "../types";
import {EventEmitter} from "../event-emitter";
import {ProvidersManager} from "../manager";
import {PluginManager} from "../manager";
import {warn} from "../../../shared-utils/debug";
import {EventMap} from "../event";


export class Planet implements IPlanet {
    private static plugins: IPluginManager = new PluginManager()
    private static instance: Planet | null = null


    readonly audioElement: HTMLAudioElement;
    readonly options: IPlanetOptions
    readonly eventEmitter: IEventEmitter<EventMap>
    readonly pluginManager: IPluginManager;
    readonly providersManager: IProvidersManager

    static use(plugin: IPlugin) {

        if (Planet.plugins.has(plugin.id)) {
            return Planet
        }
        Planet.plugins.add(plugin)
        return Planet
    }

    static getInstance(options: IPlanetOptions = {}) {
        if (!Planet.instance) {
            Planet.instance = new Planet(options)
        }
        return Planet.instance
    }

    constructor(options: IPlanetOptions = {}) {
        this.audioElement = new Audio()
        this.options = options
        this.eventEmitter = new EventEmitter()
        this.providersManager = new ProvidersManager()
        this.pluginManager = new PluginManager()

        this.init()
    }


    private init() {
        Planet.plugins.all().forEach(plugin => {
            plugin.install(this)
            this.pluginManager.add(plugin)
        })
        if (!this.providersManager.current()) {
            const err = warn(`at least one provider is required`)
            throw new Error(err)
        }
    }


}

export default Planet
