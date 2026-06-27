import { IContext } from "./types";
import { PlanetEventMap } from "./event";
import { EventEmitter, IEventEmitter } from "../event";
import { ICapabilityRegistry } from "./capability";

export class Context implements IContext {
  private readonly _audioElement: HTMLAudioElement;
  private readonly _audioContext: AudioContext;
  private readonly eventEmitter: EventEmitter<PlanetEventMap>;
  private readonly _registry: ICapabilityRegistry;

  /** @param registry the kernel capability registry, shared with every plugin. */
  constructor(registry: ICapabilityRegistry) {
    this._audioElement = new Audio();
    this._audioContext = new AudioContext();
    this.eventEmitter = new EventEmitter<PlanetEventMap>();
    this._registry = registry;
  }

  get audioElement(): HTMLAudioElement {
    return this._audioElement;
  }

  get audioContext(): AudioContext {
    return this._audioContext;
  }

  get hooks(): IEventEmitter<PlanetEventMap> {
    return this.eventEmitter;
  }

  get registry(): ICapabilityRegistry {
    return this._registry;
  }
}
