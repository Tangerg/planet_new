import { createContext, useContext } from "react";

/**
 * Trigger a shared-element morph from a start rect into the destination Hero.
 * `rect`=origin rect, `seed`/`grad`=cover colours, `run`=mounts the target
 * screen, `image`=real cover art (so the flying tile shows it, avoiding a
 * gradient→image colour jump).
 */
export type MorphFn = (
  rect: DOMRect,
  seed?: number,
  grad?: string[],
  run?: () => void,
  image?: string,
  /** Start corner radius of the flying tile (match a round source → circle→circle). */
  radius?: number | string,
) => void;

// Fallback when no provider is mounted: still navigate (run), just no animation.
// Keeps deep consumers safe without optional-chaining at every call site.
const fallback: MorphFn = (_rect, _seed, _grad, run) => run?.();

const MorphContext = createContext<MorphFn>(fallback);

/**
 * Provides the morph trigger to the screen subtree. Replaces the former
 * `window.__MORPH` global so the infra exposes a typed React API instead of
 * leaking onto `window`. The Shell wires this from useMorphTransition.
 */
export function MorphProvider({ morph, children }: { morph: MorphFn; children: React.ReactNode }) {
  return <MorphContext.Provider value={morph}>{children}</MorphContext.Provider>;
}

/** Read the morph trigger inside any screen/card (no prop-drilling, no globals). */
export function useMorph(): MorphFn {
  return useContext(MorphContext);
}
