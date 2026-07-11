import type { EventEmitter } from "../event";
import type { Disposable } from "../types";
import type { PlanetEventMap } from "./event";
import type { Plugin } from "./plugin";
import { PluginContext } from "./context";
import type { Capability } from "./capability";
import { CapabilityRegistry } from "./capability";
import { warn } from "@shared/debug";
import type { AudioRuntimePort } from "./context";

export type PlanetOption = {
  audio: AudioRuntimePort;
  plugins?: Plugin[];
};

/**
 * Topologically sort plugins by dependsOn, returning install order.
 * @throws on a missing or cyclic dependency
 */
function topoSort(plugins: Plugin[]): Plugin[] {
  const byId = new Map<string, Plugin>();
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
  const queue: Plugin[] = plugins.filter((p) => (indegree.get(p.id) ?? 0) === 0);
  const sorted: Plugin[] = [];
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

export class Planet implements Disposable {
  private readonly context: PluginContext;
  private readonly audio: AudioRuntimePort;
  // Insertion-ordered registry, keyed by plugin id. topoSort already guarantees
  // id uniqueness, so a plain Map is enough — no separate manager abstraction.
  private readonly plugins = new Map<string, Plugin>();
  // Capability registry, shared into the PluginContext so plugins publish/discover.
  private readonly capabilities = new CapabilityRegistry();
  private disposed = false;

  constructor(opt: PlanetOption) {
    this.audio = opt.audio;
    this.context = new PluginContext(this.capabilities, this.audio);

    const installed: Plugin[] = [];
    try {
      if (opt.plugins?.length) {
        const sorted = topoSort(opt.plugins);
        for (const plugin of sorted) {
          plugin.init(this.context);
          this.plugins.set(plugin.id, plugin);
          installed.push(plugin);
        }
      }
    } catch (e) {
      // If dependency validation or plugin init throws, release every resource
      // whose ownership was transferred to this Planet.
      for (const p of [...installed].reverse()) {
        try {
          p.dispose();
        } catch (err) {
          warn(`rollback dispose ${p.id} failed: ${(err as Error).message}`);
        }
      }
      this.plugins.clear();
      this.capabilities.clear();
      this.context.hooks.clear();
      this.disposeAudio();
      throw e;
    }
  }

  get hooks(): EventEmitter<PlanetEventMap> {
    return this.context.hooks;
  }

  resolve<T>(cap: Capability<T>): T | null {
    return this.capabilities.resolve(cap);
  }

  resolveAll<T>(cap: Capability<T>): readonly T[] {
    return this.capabilities.resolveAll(cap);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    // Unmount in reverse, symmetric with init order
    for (const plugin of [...this.plugins.values()].reverse()) {
      try {
        plugin.dispose();
      } catch (e) {
        warn(`dispose plugin ${plugin.id} failed: ${(e as Error).message}`);
      }
    }
    this.plugins.clear();
    this.capabilities.clear();
    this.context.hooks.clear();
    this.disposeAudio();
  }

  private disposeAudio(): void {
    try {
      this.audio.dispose();
    } catch (e) {
      warn(`dispose audio runtime failed: ${(e as Error).message}`);
    }
  }
}
