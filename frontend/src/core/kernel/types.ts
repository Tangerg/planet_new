import { IEventEmitter } from "../event";
import { Disposable, Identifiable } from "../types";
import { PlanetEventMap } from "./event";
import { Capability, ICapabilityRegistry } from "./capability";

/** Runtime context injected into every Plugin: the shared audio element, the
 *  event bus, and the capability registry (publish/discover capabilities). */
export interface IContext {
  get audioElement(): HTMLAudioElement;

  get audioContext(): AudioContext;

  get hooks(): IEventEmitter<PlanetEventMap>;

  /**
   * The capability registry — a plugin publishes what it offers via
   * `registry.provide(CAP, impl)` and reaches siblings via `registry.resolve`.
   * The one mechanism for both core and third-party capabilities.
   */
  get registry(): ICapabilityRegistry;
}

/**
 * Plugin interface. The lifecycle collapses to two hooks, init / dispose:
 *   - init(ctx) is called once by Planet at mount to inject context; subclasses subscribe to events and audio via onInit.
 *   - dispose() is called once by Planet at unmount; subclasses clean up subscriptions.
 *
 * Optional dependsOn declares runtime dependencies (by plugin id); Planet mounts in
 * topological order and unmounts in reverse. A missing or cyclic dependency throws at construction.
 */
export interface IPlugin extends Identifiable, Disposable {
  readonly dependsOn?: readonly string[];

  init(ctx: IContext): void;
}

/** Planet is the Plugin container; it exposes the event bus, plugin-by-id lookup,
 *  and capability resolution. */
export interface IPlanet extends Disposable {
  get hooks(): IEventEmitter<PlanetEventMap>;

  /** Resolve a specific singleton plugin by id (kernel-internal wiring). */
  getPlugin<T extends IPlugin = IPlugin>(id: string): T | null;

  /** Resolve the (first) impl of a capability, or null. */
  resolve<T>(cap: Capability<T>): T | null;

  /** Resolve all impls of a capability, in registration order. */
  resolveAll<T>(cap: Capability<T>): readonly T[];

  /** Unmount all plugins in reverse and clear the event bus + registry. */
  dispose(): void;
}
