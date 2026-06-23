import { IEventEmitter } from "../event";
import { PlanetEventMap } from "./event";
import { IPlanet, IContext, IPlugin } from "./types";
import { Context } from "./context";
import { IManager, Manager } from "../manager";
import { warn } from "@shared/debug";

export type PlanetOption = {
  plugins?: IPlugin[];
};

/**
 * Topologically sort plugins by dependsOn, returning install order.
 * @throws on a missing or cyclic dependency
 */
function topoSort(plugins: IPlugin[]): IPlugin[] {
  const byId = new Map<string, IPlugin>();
  for (const p of plugins) {
    if (byId.has(p.id)) {
      throw new Error(`duplicate plugin id: ${p.id}`);
    }
    byId.set(p.id, p);
  }

  // Compute each plugin indegree
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // id -> plugins that depend on it
  for (const p of plugins) {
    indegree.set(p.id, 0);
  }
  for (const p of plugins) {
    for (const depId of p.dependsOn ?? []) {
      if (!byId.has(depId)) {
        throw new Error(`plugin "${p.id}" depends on missing "${depId}"`);
      }
      indegree.set(p.id, (indegree.get(p.id) ?? 0) + 1);
      const arr = dependents.get(depId) ?? [];
      arr.push(p.id);
      dependents.set(depId, arr);
    }
  }

  // Kahn algorithm; keep original array order as the stable tiebreak at equal indegree
  const queue: IPlugin[] = plugins.filter((p) => (indegree.get(p.id) ?? 0) === 0);
  const sorted: IPlugin[] = [];
  while (queue.length > 0) {
    const head = queue.shift()!;
    sorted.push(head);
    for (const dependentId of dependents.get(head.id) ?? []) {
      const next = (indegree.get(dependentId) ?? 0) - 1;
      indegree.set(dependentId, next);
      if (next === 0) {
        queue.push(byId.get(dependentId)!);
      }
    }
  }

  if (sorted.length !== plugins.length) {
    const remaining = plugins
      .filter((p) => !sorted.includes(p))
      .map((p) => p.id)
      .join(", ");
    throw new Error(`plugin dependency cycle detected among: ${remaining}`);
  }

  return sorted;
}

export class Planet implements IPlanet {
  private readonly context: IContext;
  private readonly pluginManager: IManager<IPlugin>;

  constructor(opt?: PlanetOption) {
    this.pluginManager = new Manager();
    this.context = new Context();

    if (opt?.plugins?.length) {
      const sorted = topoSort(opt.plugins);
      const installed: IPlugin[] = [];
      try {
        for (const plugin of sorted) {
          plugin.init(this.context);
          this.pluginManager.add(plugin);
          installed.push(plugin);
        }
      } catch (e) {
        // If a plugin init throws, dispose already-mounted plugins in reverse to avoid a half-built state
        for (const p of installed.slice().reverse()) {
          try {
            p.dispose();
          } catch (err) {
            warn(`rollback dispose ${p.id} failed: ${(err as Error).message}`);
          }
        }
        this.pluginManager.clear();
        this.context.hooks.clear();
        throw e;
      }
    }
  }

  get hooks(): IEventEmitter<PlanetEventMap> {
    return this.context.hooks;
  }

  getPlugin<T extends IPlugin = IPlugin>(id: string): T | null {
    return this.pluginManager.get(id) as T | null;
  }

  dispose(): void {
    // Unmount in reverse, symmetric with init order
    const plugins = this.pluginManager.all().slice().reverse();
    for (const plugin of plugins) {
      try {
        plugin.dispose();
      } catch (e) {
        warn(`dispose plugin ${plugin.id} failed: ${(e as Error).message}`);
      }
    }
    this.pluginManager.clear();
    this.context.hooks.clear();
  }
}

export default Planet;
