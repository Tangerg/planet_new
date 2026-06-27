/**
 * Repeat mode for the play queue. The cycle order is the player convention
 * Off → All → One → Off (toggling steps through it).
 */
export enum RepeatMode {
  OFF = "off",
  ALL = "all",
  ONE = "one",
}

const CYCLE: readonly RepeatMode[] = [RepeatMode.OFF, RepeatMode.ALL, RepeatMode.ONE];

/** The next mode in the Off → All → One → Off cycle. */
export function nextRepeatMode(mode: RepeatMode): RepeatMode {
  const i = CYCLE.indexOf(mode);
  // An unknown value (i === -1) falls through to CYCLE[0] = OFF.
  return CYCLE[(i + 1) % CYCLE.length];
}
