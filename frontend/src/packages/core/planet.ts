import {IEventEmitter} from "../event";
import {PlanetEventMap} from "./event";
import {IPlanet, IContext, IPlugin} from "./types";
import {Context} from "./context"
import {IManager, Manager} from "../manager";
import {warn} from "../shared-utils/debug";


export type PlanetOption = {
    plugins?: IPlugin[];
}

/**
 * 按 dependsOn 把插件做拓扑排序，返回安装顺序。
 * @throws 缺失依赖 / 循环依赖
 */
function topoSort(plugins: IPlugin[]): IPlugin[] {
    const byId = new Map<string, IPlugin>()
    for (const p of plugins) {
        if (byId.has(p.id)) {
            throw new Error(`duplicate plugin id: ${p.id}`)
        }
        byId.set(p.id, p)
    }

    // 计算每个插件的 indegree
    const indegree = new Map<string, number>()
    const dependents = new Map<string, string[]>()   // id → 依赖它的插件们
    for (const p of plugins) {
        indegree.set(p.id, 0)
    }
    for (const p of plugins) {
        for (const depId of p.dependsOn ?? []) {
            if (!byId.has(depId)) {
                throw new Error(`plugin "${p.id}" depends on missing "${depId}"`)
            }
            indegree.set(p.id, (indegree.get(p.id) ?? 0) + 1)
            const arr = dependents.get(depId) ?? []
            arr.push(p.id)
            dependents.set(depId, arr)
        }
    }

    // Kahn's algorithm，保留原始数组顺序作为同 indegree 时的稳定排序
    const queue: IPlugin[] = plugins.filter(p => (indegree.get(p.id) ?? 0) === 0)
    const sorted: IPlugin[] = []
    while (queue.length > 0) {
        const head = queue.shift()!
        sorted.push(head)
        for (const dependentId of dependents.get(head.id) ?? []) {
            const next = (indegree.get(dependentId) ?? 0) - 1
            indegree.set(dependentId, next)
            if (next === 0) {
                queue.push(byId.get(dependentId)!)
            }
        }
    }

    if (sorted.length !== plugins.length) {
        const remaining = plugins
            .filter(p => !sorted.includes(p))
            .map(p => p.id)
            .join(", ")
        throw new Error(`plugin dependency cycle detected among: ${remaining}`)
    }

    return sorted
}

export class Planet implements IPlanet {
    private readonly context: IContext
    private readonly pluginManager: IManager<IPlugin>

    constructor(opt?: PlanetOption) {
        this.pluginManager = new Manager();
        this.context = new Context()

        if (opt?.plugins?.length) {
            const sorted = topoSort(opt.plugins)
            const installed: IPlugin[] = []
            try {
                for (const plugin of sorted) {
                    plugin.init(this.context)
                    this.pluginManager.add(plugin)
                    installed.push(plugin)
                }
            } catch (e) {
                // 某个插件 init 抛错时反向 dispose 已挂的插件，避免半成品状态
                for (const p of installed.slice().reverse()) {
                    try {
                        p.dispose()
                    } catch (err) {
                        warn(`rollback dispose ${p.id} failed: ${(err as Error).message}`)
                    }
                }
                this.pluginManager.clear()
                this.context.hooks.clear()
                throw e
            }
        }
    }

    get hooks(): IEventEmitter<PlanetEventMap> {
        return this.context.hooks;
    }

    getPlugin<T extends IPlugin = IPlugin>(id: string): T | null {
        return this.pluginManager.get(id) as T | null
    }

    dispose(): void {
        // 反序卸载，跟 init 顺序对称
        const plugins = this.pluginManager.all().slice().reverse()
        for (const plugin of plugins) {
            try {
                plugin.dispose()
            } catch (e) {
                warn(`dispose plugin ${plugin.id} failed: ${(e as Error).message}`)
            }
        }
        this.pluginManager.clear()
        this.context.hooks.clear()
    }
}

export default Planet
