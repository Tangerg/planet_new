import {IEventEmitter} from "../event";
import {PlanetEventMap} from "./event";
import {IPlanet, IContext, IPlugin} from "./types";
import {Context} from "./context"
import {IManager, Manager} from "../manager";


export type PlanetOption = {
    plugins?: IPlugin[];
}

export class Planet implements IPlanet {
    private readonly context: IContext
    private readonly pluginManager: IManager<IPlugin>

    constructor(opt?: PlanetOption) {
        this.pluginManager = new Manager();
        this.context = new Context()

        if (opt && opt.plugins) {
            opt.plugins.forEach(plugin=>{
                plugin.beforeInstall()
            })
            opt.plugins.forEach(plugin => {
                plugin.install(this.context)
            })
            opt.plugins.forEach(plugin=>{
                plugin.afterInstall()
            })
            this.pluginManager.apply(opt.plugins)
        }
    }

    get hooks(): IEventEmitter<PlanetEventMap> {
        return this.context.hooks;
    }
}

export default Planet
