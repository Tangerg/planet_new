import { IEventEmitter } from "../event";
import { IManageable } from "../manager";
import { Disposable } from "../types";
import { PlanetEventMap } from "./event";

/** Runtime context injected into every Plugin: the shared audio element, the
 *  event bus, and sibling-plugin resolution. */
export interface IContext {
  get audioElement(): HTMLAudioElement;

  get audioContext(): AudioContext;

  get hooks(): IEventEmitter<PlanetEventMap>;

  /**
   * Resolve a sibling plugin by id — lets a reactive plugin reach another
   * (e.g. the Lyric plugin reaching the provider). Returns null if not mounted.
   * Intended for runtime use (all plugins are mounted by then); declare the
   * dependency via `dependsOn` so the sibling is guaranteed installed first.
   */
  getPlugin<T extends IPlugin = IPlugin>(id: string): T | null;
}

/**
 * Plugin interface. The lifecycle collapses to two hooks, init / dispose:
 *   - init(ctx) is called once by Planet at mount to inject context; subclasses subscribe to events and audio via onInit.
 *   - dispose() is called once by Planet at unmount; subclasses clean up subscriptions.
 *
 * Optional dependsOn declares runtime dependencies (by plugin id); Planet mounts in
 * topological order and unmounts in reverse. A missing or cyclic dependency throws at construction.
 */
export interface IPlugin extends IManageable, Disposable {
  readonly dependsOn?: readonly string[];

  init(ctx: IContext): void;

  dispose(): void;
}

/** Planet is the Plugin container; it exposes the event bus and plugin-by-id lookup to the UI. */
export interface IPlanet extends Disposable {
  get hooks(): IEventEmitter<PlanetEventMap>;

  getPlugin<T extends IPlugin = IPlugin>(id: string): T | null;

  /** Unmount all plugins in reverse and clear the event bus (e.g. when switching provider). */
  dispose(): void;
}
