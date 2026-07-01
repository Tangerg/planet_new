import type { Track } from "./track";
import { RepeatMode } from "./repeat";
import { shuffleArray } from "@shared/array";

/** Outcome of an auto-advance (track ended), per repeat mode. */
export type AdvanceOutcome =
  | "advanced" // moved to the next track
  | "replay" // repeat-one: play the current track again
  | "stopped"; // end of queue with repeat off, or empty queue

/**
 * The play-queue aggregate — the whole ruleset of "what plays next", pure (no
 * audio, no events; the runtime plugin drives it and broadcasts changes).
 *
 * It keeps two orderings of the same tracks:
 *   - DISPLAY order: what the queue UI lists (never reordered by shuffle).
 *   - PLAY order: display order, or a shuffle of it; the cursor walks this one.
 * So shuffling changes only playback sequence, not the list the user sees.
 *
 * Two advance semantics, intentionally distinct:
 *   - next()/previous(): user skip — always moves, wraps at the ends.
 *   - advance(repeat): track-ended — repeat-aware (one→replay, end+off→stop).
 */
export class PlayQueue {
  private displayOrder: Track[] = [];
  private playOrder: Track[] = [];
  private cursor = -1;
  private shuffled = false;

  /** Tracks in display order (what the queue UI renders). */
  get tracks(): readonly Track[] {
    return this.displayOrder;
  }

  /** The current track, or undefined when the queue is empty. */
  get current(): Track | undefined {
    return this.playOrder[this.cursor];
  }

  get size(): number {
    return this.playOrder.length;
  }

  get isShuffled(): boolean {
    return this.shuffled;
  }

  /** Domain projection used by read models: what should be shown after current. */
  static upNext(tracks: readonly Track[], current: Track | undefined): readonly Track[] {
    if (!current) return tracks;
    const at = tracks.findIndex((track) => track.id === current.id);
    return at >= 0 ? tracks.slice(at + 1) : tracks;
  }

  /** Replace the queue and place the cursor at `start` (or the first track). */
  setTracks(tracks: readonly Track[], start?: Track): void {
    this.displayOrder = [...tracks];
    this.rebuildPlayOrder();
    if (this.playOrder.length === 0) {
      this.cursor = -1;
      return;
    }
    const at = start ? this.indexOf(start) : -1;
    this.cursor = at >= 0 ? at : 0;
  }

  clear(): void {
    this.displayOrder = [];
    this.playOrder = [];
    this.cursor = -1;
  }

  /** Append a track to the back of the queue (no-op if already present). */
  add(track: Track): void {
    if (this.indexOf(track) !== -1) return;
    this.displayOrder.push(track);
    this.playOrder.push(track);
  }

  /** Remove a track; if it was current the cursor falls onto the next track. */
  remove(track: Track): void {
    const at = this.indexOf(track);
    if (at === -1) return;
    this.playOrder.splice(at, 1);
    this.displayOrder = this.displayOrder.filter((t) => t.id !== track.id);
    if (this.playOrder.length === 0) {
      this.cursor = -1;
      return;
    }
    if (at < this.cursor) {
      this.cursor -= 1;
    } else if (at === this.cursor && this.cursor >= this.playOrder.length) {
      // removed the last track while it was current → wrap to the start
      this.cursor = 0;
    }
    // at === cursor (not last): the next track slid into this slot — cursor stays.
  }

  /** Move the cursor to a track. Returns whether it actually moved. */
  select(track: Track): boolean {
    const at = this.indexOf(track);
    if (at === -1 || at === this.cursor) return false;
    this.cursor = at;
    return true;
  }

  /** User skip forward — always advances, wrapping past the end. */
  next(): Track | undefined {
    if (this.playOrder.length === 0) return undefined;
    this.cursor = (this.cursor + 1) % this.playOrder.length;
    return this.current;
  }

  /** User skip backward — always retreats, wrapping past the start. */
  previous(): Track | undefined {
    if (this.playOrder.length === 0) return undefined;
    this.cursor = (this.cursor - 1 + this.playOrder.length) % this.playOrder.length;
    return this.current;
  }

  /** Auto-advance on track end, honouring the repeat mode (see AdvanceOutcome). */
  advance(repeat: RepeatMode): AdvanceOutcome {
    if (this.playOrder.length === 0) return "stopped";
    if (repeat === RepeatMode.ONE) return "replay";
    const isLast = this.cursor === this.playOrder.length - 1;
    if (isLast && repeat === RepeatMode.OFF) return "stopped";
    this.cursor = (this.cursor + 1) % this.playOrder.length;
    return "advanced";
  }

  /** Toggle shuffle, re-deriving the play order while keeping the current track. */
  toggleShuffle(): boolean {
    return this.setShuffle(!this.shuffled);
  }

  /** Set shuffle explicitly, re-deriving play order while keeping the current track. */
  setShuffle(enabled: boolean): boolean {
    if (this.shuffled === enabled) return this.shuffled;
    this.shuffled = enabled;
    if (this.playOrder.length === 0) return this.shuffled;
    const keep = this.current!;
    this.rebuildPlayOrder();
    this.cursor = this.indexOf(keep);
    return this.shuffled;
  }

  /** Derive playOrder from displayOrder: a shuffle of it when shuffled, else a copy. */
  private rebuildPlayOrder(): void {
    this.playOrder = this.shuffled ? shuffleArray(this.displayOrder) : [...this.displayOrder];
  }

  private indexOf(track: Track): number {
    return this.playOrder.findIndex((t) => t.id === track.id);
  }
}
