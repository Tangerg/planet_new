import type { CardItem } from "@/model/vibe";

/**
 * The open/play activation contract shared by the memoized cover cards —
 * MediaCard (grid/rail tile) and CollectionRow (list row).
 *
 * Callbacks take the item ON PURPOSE: a caller passes ONE reused handler
 * reference (e.g. `onOpen={openPlaylist}`), never a fresh `() => open(item)` per
 * cell. That stable identity is exactly what lets the card's `React.memo` bail on
 * each scroll windowing tick — build the per-item closure inside `renderItem`
 * instead and the memo is defeated, re-rendering every visible card per tick.
 * Preserve this invariant when wiring new call sites.
 */
export type CardActivation<T extends CardItem> = {
  item: T;
  onOpen: (item: T) => void;
  onPlay?: (item: T) => void;
  /** Show the play affordance. Default true; pass false to hide it per-item (e.g.
   *  a collection with no playable track) while keeping onPlay a stable reference. */
  playable?: boolean;
};
