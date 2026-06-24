/**
 * PS5-style dynamic ambient glow: the page background follows the focused
 * card. Extracted from Shell.tsx for separation of concerns.
 */
import { useCallback, useEffect } from "react";

import { artBg } from "./primitives";

export function useAmbient(view: string) {
  const setAmbient = useCallback((seed?: number, grad?: string[]) => {
    const el = document.getElementById("ambient");
    if (!el) return;
    el.style.background = artBg(seed, grad);
    el.style.opacity = ".5";
  }, []);

  useEffect(() => {
    window.__AMBIENT = setAmbient;
    return () => {
      window.__AMBIENT = undefined;
    };
  });

  useEffect(() => {
    const el = document.getElementById("ambient");
    if (el) el.style.opacity = "0";
  }, [view]);

  return { setAmbient };
}
