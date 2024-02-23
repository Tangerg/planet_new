import {
    IEventEmitter,
    IPlanet,
    IPlanetOptions,
    IPlugin,
    IPluginManager,
    IProvidersManager,
} from "./types";
import {EventEmitter} from "../event-emitter";
import {ProvidersManager} from "../provider";
import {warn} from "../../shared-utils/debug";
import {PluginManager} from "./plugin";


export class Planet extends EventEmitter implements IPlanet {
    private static plugins: IPlugin[] = []
    private static instance: Planet | null = null


    readonly audioElement: HTMLAudioElement;
    readonly options: IPlanetOptions
    readonly eventEmitter: IEventEmitter
    readonly pluginManager: IPluginManager;
    readonly providersManager: IProvidersManager

    static use(plugin: IPlugin) {
        const installed = Planet.plugins.some(
            p => p.name() === plugin.name()
        )
        if (installed) {
            return Planet
        }
        Planet.plugins.push(plugin)
        return Planet
    }

    static getInstance(options: IPlanetOptions = {}) {
        if (!Planet.instance) {
            Planet.instance = new Planet(options)
        }
        return Planet.instance
    }

    constructor(options: IPlanetOptions = {}) {
        super();
        this.audioElement = new Audio()
        this.options = options
        this.eventEmitter = new EventEmitter()
        this.providersManager = new ProvidersManager()
        this.pluginManager = new PluginManager()


        this.init()
    }


    private init() {
        Planet.plugins.forEach(plugin => {
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
