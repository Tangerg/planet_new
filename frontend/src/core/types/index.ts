/* -------------------------------------------------------------------------- */
/* Common structural interfaces */
/* -------------------------------------------------------------------------- */

/** Anything with a stable id (Planet keys its plugin registry by it). */
export interface Identifiable {
  get id(): string;
}

/** Something with one-shot release semantics (remove listeners, stop timers, ...). */
export interface Disposable {
  dispose(): void;
}

/** Something that can clear all of its internal state. */
export interface Clearable {
  clear(): void;
}
