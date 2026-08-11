/**
 * Arrow-key spatial navigation inside non-XMB screens. Picks the nearest
 * focusable element in the pressed direction by geometry. Extracted from
 * Shell.tsx.
 */
import { useEffect } from "react";
import type { RefObject } from "react";

import { useEventCallback } from "@/hooks/useEventCallback";
import { LAUNCHER_VIEW, type ShellScreenView } from "@/model/shell-screen";
import {
  nearestSpatialCandidate,
  shouldLetTextInputHandleArrow,
  spatialDirectionFromKey,
  type SpatialCandidate,
} from "@/model/spatial-navigation";

function spatialCandidate(el: HTMLElement): SpatialCandidate<HTMLElement> {
  return {
    item: el,
    rect: el.getBoundingClientRect(),
  };
}

export function useSpatialNavigation(
  viewRef: RefObject<HTMLDivElement | null>,
  view: ShellScreenView,
  goBack: () => void,
) {
  const onGoBack = useEventCallback(goBack);

  useEffect(() => {
    if (view === LAUNCHER_VIEW) return;
    const root = viewRef.current;
    if (!root) return;
    const list = () =>
      (
        [
          ...root.querySelectorAll(
            'button:not([disabled]), input, [tabindex]:not([tabindex="-1"]), a[href]',
          ),
        ] as HTMLElement[]
      ).filter((el) => el.offsetWidth > 0 && el.offsetHeight > 0);
    const t = setTimeout(() => {
      const f = list();
      if (f.length && !root.contains(document.activeElement)) f[0].focus();
    }, 90);
    const onKey = (e: KeyboardEvent) => {
      const ae = document.activeElement as HTMLElement | null;
      const inInput = ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA");
      const direction = spatialDirectionFromKey(e.key);
      if (direction) {
        if (shouldLetTextInputHandleArrow(e.key, ae?.tagName)) return;
        const items = list();
        if (!items.length) return;
        const cur = ae && root.contains(ae) ? ae : items[0];
        const next = nearestSpatialCandidate(
          spatialCandidate(cur),
          direction,
          items.map(spatialCandidate),
        );
        if (next) {
          e.preventDefault();
          next.focus();
        }
      } else if (e.key === "Backspace" && !inInput) {
        e.preventDefault();
        onGoBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [view, viewRef, onGoBack]);
}
