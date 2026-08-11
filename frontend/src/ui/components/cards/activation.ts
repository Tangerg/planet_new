import type React from "react";

import { useMorphOpen } from "@/hooks/useMorphOpen";
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

type CardActivationGesture = (event: React.MouseEvent | React.KeyboardEvent) => void;

/**
 * The open gesture those same two cards share: fly the shared-element morph from
 * the item's artwork, then run `onOpen`. Only the art selector differs between
 * them (the grid tile's `.art`, the row's `.clrt`).
 *
 * `activateFromTarget` is the same gesture for the keyboard-reachable targets
 * nested inside the card's own click surface — it stops propagation so the outer
 * surface does not also fire and start a second morph.
 */
export function useCardActivation<T extends CardItem>(
  { item, onOpen }: Pick<CardActivation<T>, "item" | "onOpen">,
  art: { selector: string; round?: boolean },
): { activate: CardActivationGesture; activateFromTarget: CardActivationGesture } {
  const open = useMorphOpen();
  const activate: CardActivationGesture = (e) =>
    open(e, {
      seed: item.coverSeed,
      grad: item.gradient,
      image: item.image,
      round: art.round,
      artSelector: art.selector,
      run: () => onOpen(item),
    });
  return {
    activate,
    activateFromTarget: (e) => {
      e.stopPropagation();
      activate(e);
    },
  };
}
