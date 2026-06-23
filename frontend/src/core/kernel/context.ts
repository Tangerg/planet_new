import { IContext } from "./types";
import { PlanetEventMap } from "./event";
import { EventEmitter, IEventEmitter } from "../event";

export class Context implements IContext {
  private readonly _audioElement: HTMLAudioElement;
  private readonly _audioContext: AudioContext;
  private readonly eventEmitter: EventEmitter<PlanetEventMap>;

  constructor() {
    this._audioElement = new Audio();
    this._audioContext = new AudioContext();
    this.eventEmitter = new EventEmitter<PlanetEventMap>();
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
}
