import { IContext, IPlugin } from "./types";
import { PlanetEventMap } from "./event";
import { EventEmitter, IEventEmitter } from "../event";

export class Context implements IContext {
  private readonly _audioElement: HTMLAudioElement;
  private readonly _audioContext: AudioContext;
  private readonly eventEmitter: EventEmitter<PlanetEventMap>;
  private readonly resolvePlugin: (id: string) => IPlugin | null;

  /** @param resolvePlugin sibling-plugin resolver, wired by Planet to its manager. */
  constructor(resolvePlugin: (id: string) => IPlugin | null) {
    this._audioElement = new Audio();
    this._audioContext = new AudioContext();
    this.eventEmitter = new EventEmitter<PlanetEventMap>();
    this.resolvePlugin = resolvePlugin;
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

  getPlugin<T extends IPlugin = IPlugin>(id: string): T | null {
    return this.resolvePlugin(id) as T | null;
  }
}
