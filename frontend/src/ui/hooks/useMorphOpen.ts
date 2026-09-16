import { useCallback } from "react";
import { useMorph, type MorphSource } from "@/infra/morph";

export type MorphOpenOptions = Omit<MorphSource, "radius" | "run"> & {
  round?: boolean;
  artSelector?: string;
  run: () => void;
};

export function useMorphOpen() {
  const morph = useMorph();
  return useCallback(
    (e: { currentTarget: Element }, opts: MorphOpenOptions) => {
      const { seed, grad, image, round, artSelector, run } = opts;
      const art = artSelector ? e.currentTarget.querySelector(artSelector) : null;
      const rect = (art ?? e.currentTarget).getBoundingClientRect();
      morph({ seed, grad, image, run, radius: round ? "50%" : undefined }, rect);
    },
    [morph],
  );
}
