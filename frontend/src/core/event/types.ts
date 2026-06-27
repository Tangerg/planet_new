/** Event-name -> payload-type map; the type parameter for the emitter. */
export interface EventMap {
  readonly [key: string]: unknown;
}

/** A single event listener: receives that event's payload. */
export type EventHandler<E extends EventMap, K extends keyof E> = (arg: E[K]) => void;
