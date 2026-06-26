// ============================================================
// useMorphOpen — converges the "measure a card's art rect, then fly the
// shared-element morph to the opened screen" gesture that every card/row/tile
// repeated inline. The morph engine itself (@/infra/morph) is untouched; this is
// just the call-site helper that measures the origin rect and invokes it.
// ============================================================
import { useCallback } from "react";
import { useMorph } from "@/infra/morph";

export type MorphOpenOptions = {
  seed?: number;
  grad?: string[];
  image?: string;
  /** Circular origin (artists) → the flying tile collapses as a circle. */
  round?: boolean;
  /** Selector for the art element inside the clicked container to measure as the
   *  morph origin; falls back to the container itself when absent/not found. */
  artSelector?: string;
  /** Navigation to run once the morph has captured the origin rect. */
  run: () => void;
};

/** Returns `open(event, opts)` — measures the origin rect and starts the morph. */
export function useMorphOpen() {
  const morph = useMorph();
  return useCallback(
    (e: { currentTarget: Element }, opts: MorphOpenOptions) => {
      const { seed, grad, image, round, artSelector, run } = opts;
      const art = artSelector ? e.currentTarget.querySelector(artSelector) : null;
      const rect = (art ?? e.currentTarget).getBoundingClientRect();
      morph(rect, seed, grad, run, image, round ? "50%" : undefined);
    },
    [morph],
  );
}
