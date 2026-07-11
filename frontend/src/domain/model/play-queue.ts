import type { Track } from "./track";
import { TrackKey } from "./entity-key";
import { RepeatMode } from "./repeat";
import { shuffleArray } from "@shared/array";

/** Outcome of an auto-advance (track ended), per repeat mode. */
export type AdvanceOutcome =
  | "advanced" // moved to the next track
  | "replay" // repeat-one: play the current track again
  | "stopped"; // end of queue with repeat off, or empty queue

export type QueueMoveOutcome =
  | "changed" // current moved to another track
  | "unchanged"; // no next/previous track in the active repeat mode

/** Entropy port used by shuffle; infrastructure owns the concrete source. */
export interface RandomSource {
  /** A value in the half-open range [0, 1). */
  next(): number;
}

/**
 * The play-queue aggregate — the whole ruleset of "what plays next", pure (no
 * audio, no events; the runtime plugin drives it and broadcasts changes).
 *
 * It keeps two orderings of the same tracks:
 *   - DISPLAY order: what the queue UI lists (never reordered by shuffle).
 *   - PLAY order: display order, or a shuffle of it; the cursor walks this one.
 * So shuffling changes only playback sequence, not the list the user sees.
 *
 * Three movement semantics, intentionally distinct:
 *   - next()/previous(): user skip — wraps only in list-repeat mode.
 *   - advance(repeat): track-ended — repeat-aware (one→replay, end+off→stop).
 *   - addNext(): queue edit — inserts/moves a track directly after current.
 */
export class PlayQueue {
  private displayOrder: Track[] = [];
  private playOrder: Track[] = [];
  private cursor = -1;
  private shuffled = false;

  constructor(private readonly random: RandomSource) {}

  /** Tracks in display order (what the queue UI renders). */
  get tracks(): readonly Track[] {
    return this.displayOrder;
  }

  /** Tracks in actual playback order (what "Up Next" should follow). */
  get playbackOrder(): readonly Track[] {
    return this.playOrder;
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
    const currentKey = PlayQueue.keyOf(current);
    const at = tracks.findIndex((track) => PlayQueue.keyOf(track) === currentKey);
    return at >= 0 ? tracks.slice(at + 1) : tracks;
  }

  /** This queue's own up-next projection, in playback order (same rule as the static). */
  get upNext(): readonly Track[] {
    return PlayQueue.upNext(this.playOrder, this.current);
  }

  /** Replace the queue and place the cursor at `start` (or the first track). */
  setTracks(tracks: readonly Track[], start?: Track): void {
    const seen = new Set<TrackKey>();
    this.displayOrder = tracks.filter((track) => {
      const key = PlayQueue.keyOf(track);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (this.displayOrder.length === 0) {
      this.playOrder = [];
      this.cursor = -1;
      return;
    }
    const startAt = start ? this.displayIndexOf(start) : -1;
    const anchor = startAt >= 0 ? this.displayOrder[startAt] : this.displayOrder[0];
    this.rebuildPlayOrder(anchor);
  }

  clear(): void {
    this.displayOrder = [];
    this.playOrder = [];
    this.cursor = -1;
  }

  /** Append a track to the back of the queue (no-op if already present). */
  add(track: Track): boolean {
    if (this.indexOf(track) !== -1) return false;
    this.displayOrder.push(track);
    this.playOrder.push(track);
    return true;
  }

  /** Insert or move a track so it becomes the next track after the current one. */
  addNext(track: Track): boolean {
    const current = this.current;
    if (current && PlayQueue.keyOf(current) === PlayQueue.keyOf(track)) return false;

    // If it's already queued, pull it out first, keeping the cursor on `current`.
    const at = this.detach(track);
    if (at !== -1 && at < this.cursor) this.cursor -= 1;

    const displayAt = current ? this.displayIndexOf(current) + 1 : this.displayOrder.length;
    this.displayOrder.splice(displayAt, 0, track);

    const playAt = this.cursor >= 0 ? this.cursor + 1 : 0;
    this.playOrder.splice(playAt, 0, track);
    return true;
  }

  /** Remove a track; if it was current the cursor falls onto the next track if one exists. */
  remove(track: Track): boolean {
    const at = this.detach(track);
    if (at === -1) return false;
    if (this.playOrder.length === 0) {
      this.cursor = -1;
    } else if (at < this.cursor) {
      this.cursor -= 1;
    } else if (at === this.cursor && this.cursor >= this.playOrder.length) {
      // Removed the current tail; there is no natural "next" track, so stop.
      this.cursor = -1;
    }
    // at === cursor (not last): the next track slid into this slot — cursor stays.
    return true;
  }

  /** Move the cursor to a track. Returns whether it actually moved. */
  select(track: Track): boolean {
    const at = this.indexOf(track);
    if (at === -1 || at === this.cursor) return false;
    this.cursor = at;
    return true;
  }

  /** User skip forward — wraps only when list-repeat is enabled. */
  next(repeat: RepeatMode): QueueMoveOutcome {
    return this.step(1, repeat);
  }

  /** User skip backward — wraps only when list-repeat is enabled. */
  previous(repeat: RepeatMode): QueueMoveOutcome {
    return this.step(-1, repeat);
  }

  /**
   * One user-skip step in `delta` direction. From "no current" a skip enters at
   * the near end for that direction; stepping past an end wraps only in
   * list-repeat, otherwise the cursor stays put.
   */
  private step(delta: 1 | -1, repeat: RepeatMode): QueueMoveOutcome {
    const size = this.playOrder.length;
    if (size === 0) return "unchanged";
    const wrapEnd = delta > 0 ? 0 : size - 1;
    if (this.cursor === -1) {
      this.cursor = wrapEnd;
      return "changed";
    }
    const target = this.cursor + delta;
    if (target >= 0 && target < size) {
      this.cursor = target;
      return "changed";
    }
    if (repeat === RepeatMode.ALL) {
      this.cursor = wrapEnd;
      return "changed";
    }
    return "unchanged";
  }

  /** Auto-advance on track end, honouring the repeat mode (see AdvanceOutcome). */
  advance(repeat: RepeatMode): AdvanceOutcome {
    if (this.playOrder.length === 0) return "stopped";
    if (this.cursor === -1) return "stopped";
    if (repeat === RepeatMode.ONE) return "replay";
    if (this.cursor === this.playOrder.length - 1 && repeat === RepeatMode.OFF) return "stopped";
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
    const keep = this.current;
    this.rebuildPlayOrder(keep);
    if (!keep) this.cursor = -1;
    return this.shuffled;
  }

  /** Derive playOrder from displayOrder: a shuffle of it when shuffled, else a copy. */
  private rebuildPlayOrder(anchor?: Track): void {
    if (!anchor || this.displayIndexOf(anchor) === -1) {
      this.playOrder = this.shuffled
        ? shuffleArray(this.displayOrder, () => this.random.next())
        : [...this.displayOrder];
      this.cursor = this.playOrder.length > 0 ? 0 : -1;
      return;
    }

    if (this.shuffled) {
      const anchorKey = PlayQueue.keyOf(anchor);
      const rest = this.displayOrder.filter((track) => PlayQueue.keyOf(track) !== anchorKey);
      this.playOrder = [anchor, ...shuffleArray(rest, () => this.random.next())];
      this.cursor = 0;
      return;
    }

    this.playOrder = [...this.displayOrder];
    this.cursor = this.indexOf(anchor);
  }

  private indexOf(track: Track): number {
    const key = PlayQueue.keyOf(track);
    return this.playOrder.findIndex((candidate) => PlayQueue.keyOf(candidate) === key);
  }

  private displayIndexOf(track: Track): number {
    const key = PlayQueue.keyOf(track);
    return this.displayOrder.findIndex((candidate) => PlayQueue.keyOf(candidate) === key);
  }

  /**
   * Remove a track from both orders and return its former play-order index (-1
   * if absent). Leaves the cursor untouched — callers own the cursor semantics
   * (remove() may stop; addNext() shifts to keep the current track).
   */
  private detach(track: Track): number {
    const key = PlayQueue.keyOf(track);
    const at = this.indexOf(track);
    if (at !== -1) this.playOrder.splice(at, 1);
    this.displayOrder = this.displayOrder.filter((candidate) => PlayQueue.keyOf(candidate) !== key);
    return at;
  }

  private static keyOf(track: Track): TrackKey {
    return TrackKey.of(track.providerId, track.id);
  }
}
