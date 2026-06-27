import type { EventHandler, EventMap } from "./types";
import type { Clearable } from "../types";

type Subscription = {
  fn: Function;
  ctx: object;
  once: boolean;
};

/** Standard pub/sub bus; clear() removes all listeners at once. */
export class EventEmitter<E extends EventMap> implements Clearable {
  private readonly listeners: Map<keyof E, Subscription[]>;

  constructor() {
    this.listeners = new Map<keyof E, Subscription[]>();
  }

  private getOrCreate(name: keyof E): Subscription[] {
    let list = this.listeners.get(name);
    if (!list) {
      list = [];
      this.listeners.set(name, list);
    }
    return list;
  }

  on<K extends keyof E>(name: K, fn: EventHandler<E, K>, ctx: object = this): this {
    this.getOrCreate(name).push({ fn, ctx, once: false });
    return this;
  }

  once<K extends keyof E>(name: K, fn: EventHandler<E, K>, ctx: object = this): this {
    this.getOrCreate(name).push({ fn, ctx, once: true });
    return this;
  }

  off<K extends keyof E>(name: K, fn?: EventHandler<E, K>): this {
    const list = this.listeners.get(name);
    if (!list) {
      return this;
    }
    if (!fn) {
      this.listeners.set(name, []);
      return this;
    }
    // Build a new array via filter so an external off() during emit cannot mutate the emit snapshot
    this.listeners.set(
      name,
      list.filter((l) => l.fn !== fn),
    );
    return this;
  }

  emit<K extends keyof E>(name: K, arg?: E[K]): void {
    const list = this.listeners.get(name);
    if (!list || list.length === 0) {
      return;
    }
    // on/off/once inside a listener during emit must not mutate this dispatch: iterate a snapshot.
    const snapshot = list.slice();
    for (const l of snapshot) {
      l.fn.call(l.ctx, arg);
      if (l.once) {
        this.off(name, l.fn as EventHandler<E, K>);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
