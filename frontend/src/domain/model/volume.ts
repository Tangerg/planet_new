import { getNumberInRange } from "@shared/math";

/** Restore target on unmute when there is no remembered non-zero level. */
const DEFAULT_UNMUTE_LEVEL = 30;

/**
 * Volume value object on the 0..100 scale, immutable: every change returns a new
 * instance. It carries the rule the UI shouldn't re-implement — `previous` holds
 * the last non-zero level so unmute restores where the user was (or 30 if they
 * started muted). `muted` is just `level === 0`, so the store needs no extra flag.
 */
export class Volume {
  private constructor(
    /** Current level, 0..100. */
    readonly level: number,
    /** Last non-zero level, for unmute restore. */
    private readonly previous: number,
  ) {}

  /** Build from a raw level (clamped + rounded). */
  static of(level: number): Volume {
    const v = clampLevel(level);
    return new Volume(v, v);
  }

  get muted(): boolean {
    return this.level === 0;
  }

  /** Set a new level (clamped), remembering the prior non-zero level for unmute. */
  set(level: number): Volume {
    const next = clampLevel(level);
    const remembered = this.level > 0 ? this.level : this.previous;
    return new Volume(next, next > 0 ? next : remembered);
  }

  /** Mute (to 0, remembering the current level) or unmute (restore it, or 30). */
  toggleMute(): Volume {
    if (this.level > 0) {
      return new Volume(0, this.level);
    }
    const restore = this.previous > 0 ? this.previous : DEFAULT_UNMUTE_LEVEL;
    return new Volume(restore, restore);
  }
}

function clampLevel(level: number): number {
  return getNumberInRange(0, 100, Math.round(level));
}
