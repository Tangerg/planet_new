import { createContext, use } from "react";

/**
 * The shared element a morph flies: `seed`/`grad` are the cover colours, `image`
 * the real cover art (so the tile shows it and there is no gradient→image colour
 * jump), `run` mounts the target screen, `radius` the tile's start corner radius
 * (a round source passes "50%" so it flies circle→circle).
 */
export type MorphSource = {
  seed?: number;
  grad?: string[];
  image?: string;
  radius?: number | string;
  run?: () => void;
};

/** Trigger a shared-element morph from `rect` into the destination Hero. This is
 *  the engine's `startForward` — the same entry point the launcher uses, handed
 *  down to deep consumers through the context below. */
export type MorphFn = (source: MorphSource, rect: DOMRect) => void;

// Fallback when no provider is mounted: still navigate (run), just no animation.
// Keeps deep consumers safe without optional-chaining at every call site.
const fallback: MorphFn = (source) => source.run?.();

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
  return use(MorphContext);
}

// ---------------------------------------------------------------------------
// Outgoing-layer freeze
//
// During a transition the leaving screen is re-rendered as the `t-from` layer
// (see MorphStage). Its in-page entrance animations must NOT replay there — a
// from-opacity:0 entrance would flash as the screen slides away. The CSS design
// system froze this with `.t-from * { animation: none !important }`, but that
// `!important` only catches CSS `animation`, not Motion. So the stage wraps the
// outgoing render in <MorphFrozen> and the Motion entrance primitives
// (FadeIn/Rise/XFade/…) read useMorphFrozen() to render at their final state.
// This is purely additive — the morph mechanism (clip / container-transform /
// flying tile) is unchanged.
// ---------------------------------------------------------------------------
const FrozenContext = createContext(false);

/** Marks its subtree as the outgoing morph layer (entrances render frozen). */
export function MorphFrozen({ children }: { children: React.ReactNode }) {
  return <FrozenContext.Provider value={true}>{children}</FrozenContext.Provider>;
}

/** True when rendered on the outgoing `t-from` layer — skip entrance animation. */
export function useMorphFrozen(): boolean {
  return use(FrozenContext);
}
