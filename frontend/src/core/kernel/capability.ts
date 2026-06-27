/**
 * A typed handle to a capability slot on the kernel registry. Share the const
 * between the plugin that provides the capability and the consumers that resolve
 * it — the phantom `__type` carries T for inference (provide/resolve type-check
 * against it) and is never read. Mirrors lynx's defineExtensionPoint idea.
 */
export interface Capability<T> {
  readonly key: string;
  readonly __type?: T;
}

/** Define a capability token. */
export function defineCapability<T>(key: string): Capability<T> {
  return { key };
}

/**
 * The one mechanism both core and (future) third-party plugins use to publish
 * and discover capabilities — there is no special-cased lookup. A capability may
 * have a single impl (resolve) or many (resolveAll, e.g. every music provider).
 */
export interface ICapabilityRegistry {
  provide<T>(cap: Capability<T>, impl: T): void;
  revoke<T>(cap: Capability<T>, impl: T): void;
  /** First registered impl, or null. */
  resolve<T>(cap: Capability<T>): T | null;
  /** All registered impls, in registration order. */
  resolveAll<T>(cap: Capability<T>): readonly T[];
}

export class CapabilityRegistry implements ICapabilityRegistry {
  private readonly impls = new Map<string, unknown[]>();

  provide<T>(cap: Capability<T>, impl: T): void {
    const list = this.impls.get(cap.key) ?? [];
    if (!list.includes(impl)) list.push(impl);
    this.impls.set(cap.key, list);
  }

  revoke<T>(cap: Capability<T>, impl: T): void {
    const list = this.impls.get(cap.key);
    if (list) {
      this.impls.set(
        cap.key,
        list.filter((x) => x !== impl),
      );
    }
  }

  resolve<T>(cap: Capability<T>): T | null {
    return (this.impls.get(cap.key)?.[0] as T | undefined) ?? null;
  }

  resolveAll<T>(cap: Capability<T>): readonly T[] {
    return (this.impls.get(cap.key) ?? []) as T[];
  }

  clear(): void {
    this.impls.clear();
  }
}
