/**
 * Arrow-key spatial navigation inside non-XMB screens. Picks the nearest
 * focusable element in the pressed direction by geometry. Extracted from
 * Shell.tsx.
 */
import { useEffect } from "react";
import type { RefObject } from "react";

/** Pick the nearest focusable in a direction (by geometry). */
function nearestInDirection(
  current: HTMLElement,
  dir: string,
  candidates: HTMLElement[],
): HTMLElement | null {
  const c = current.getBoundingClientRect();
  const cx = c.left + c.width / 2,
    cy = c.top + c.height / 2;
  let best: HTMLElement | null = null,
    bestScore = Infinity;
  for (const el of candidates) {
    if (el === current) continue;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2,
      y = r.top + r.height / 2;
    const dx = x - cx,
      dy = y - cy;
    let primary: number, secondary: number;
    if (dir === "right") {
      if (dx <= 4) continue;
      primary = dx;
      secondary = Math.abs(dy);
    } else if (dir === "left") {
      if (dx >= -4) continue;
      primary = -dx;
      secondary = Math.abs(dy);
    } else if (dir === "down") {
      if (dy <= 4) continue;
      primary = dy;
      secondary = Math.abs(dx);
    } else {
      if (dy >= -4) continue;
      primary = -dy;
      secondary = Math.abs(dx);
    }
    const score = primary + secondary * 2.2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

export function useSpatialNavigation(
  viewRef: RefObject<HTMLDivElement | null>,
  view: string,
  startReverse: () => void,
) {
  useEffect(() => {
    if (view === "xmb") return;
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
      const arrows: Record<string, string> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      if (arrows[e.key]) {
        if (inInput && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return;
        const items = list();
        if (!items.length) return;
        const cur = ae && root.contains(ae) ? ae : items[0];
        const next = nearestInDirection(cur, arrows[e.key], items);
        if (next) {
          e.preventDefault();
          next.focus();
        }
      } else if (e.key === "Backspace" && !inInput) {
        e.preventDefault();
        startReverse();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [view, viewRef, startReverse]);
}
