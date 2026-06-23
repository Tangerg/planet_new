import { Clearable } from "../types";

/** Event-name -> payload-type map; the type parameter for the emitter. */
export interface IEventMap {
  readonly [key: string]: unknown;
}

/** A single event listener: receives that event payload. */
export interface IEventListener<E extends IEventMap, K extends keyof E> extends Function {
  (arg: E[K]): void;
}

/** Standard pub/sub emitter; clear() removes all listeners at once. */
export interface IEventEmitter<E extends IEventMap> extends Clearable {
  on<K extends keyof E>(name: K, fn: IEventListener<E, K>, ctx?: Object): IEventEmitter<E>;

  once<K extends keyof E>(name: K, fn: IEventListener<E, K>, ctx?: Object): IEventEmitter<E>;

  off<K extends keyof E>(name: K, fn?: IEventListener<E, K>): IEventEmitter<E>;

  emit<K extends keyof E>(name: K, arg?: E[K]): void;
}

export default IEventEmitter;
