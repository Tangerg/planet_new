import type { PlanetEventMap } from "./event";
import { EventEmitter } from "../event";
import type { CapabilityRegistry } from "./capability";

/**
 * Runtime context injected into every Plugin: the shared audio element, the
 * event bus, and the capability registry. A plugin publishes what it offers via
 * `registry.provide(CAP, impl)` and reaches siblings via `registry.resolve` —
 * the one mechanism for both core and third-party capabilities.
 */
export class PluginContext {
  private readonly _audioElement: HTMLAudioElement;
  private readonly _audioContext: AudioContext;
  private readonly _hooks: EventEmitter<PlanetEventMap>;
  private readonly _registry: CapabilityRegistry;

  /** @param registry the kernel capability registry, shared with every plugin. */
  constructor(registry: CapabilityRegistry) {
    this._audioElement = new Audio();
    this._audioContext = new AudioContext();
    this._hooks = new EventEmitter<PlanetEventMap>();
    this._registry = registry;
  }

  get audioElement(): HTMLAudioElement {
    return this._audioElement;
  }

  get audioContext(): AudioContext {
    return this._audioContext;
  }

  get hooks(): EventEmitter<PlanetEventMap> {
    return this._hooks;
  }

  get registry(): CapabilityRegistry {
    return this._registry;
  }
}
