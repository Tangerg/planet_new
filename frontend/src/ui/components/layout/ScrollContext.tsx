// ============================================================
// ScrollContext — lets a screen publish its scroll container so the windowed
// grid / list / rail inside it can virtualize against the right scroller without
// prop-drilling a ref through every layer. The scaffold (or a screen) provides
// the ref; CardGrid / TrackList read it via useScrollRef().
// ============================================================
import { createContext, useContext } from "react";
import type { RefObject } from "react";

export type ScrollRef = RefObject<HTMLElement | null>;

const ScrollContext = createContext<ScrollRef | null>(null);

export const ScrollProvider = ScrollContext.Provider;

/** The enclosing screen's scroll container, or null outside a provider. */
export function useScrollRef(): ScrollRef | null {
  return useContext(ScrollContext);
}
