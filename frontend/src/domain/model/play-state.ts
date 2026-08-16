/**
 * Audible transport state. "Stopped" also covers "nothing is loaded", which is
 * why this is a three-state value rather than an isPlaying boolean.
 */
export enum PlayState {
  PLAYING = "playing",
  PAUSED = "paused",
  STOPPED = "stopped",
}
