import type React from "react";
import { useEffect, useRef } from "react";

import type { VibeCollection, VibeTrack } from "@/model/vibe";
import type { FlowItem } from "@/model/derive";
import { useEventCallback } from "@/hooks/useEventCallback";

// `drag` is dual-use: a number accumulates horizontal wheel delta, an object
// tracks an in-flight pointer drag (start pointer x + start center), null idle.
type DragState = number | { x: number; start: number } | null;

/**
 * Input driving for the CoverFlow carousel — keyboard (window, capture phase so
 * it wins over global spatial-nav), horizontal wheel, and pointer drag. Arrows
 * move the center / expand the tracklist, Enter opens the centered item. The
 * keydown handler is stable (installed once) but always reads the latest state
 * via useEventCallback; the pointer handlers are plain per-render closures.
 */
export function useCoverFlowInput<T extends VibeTrack | VibeCollection>(params: {
  items: FlowItem<T>[];
  center: number;
  expanded: boolean;
  expandable: unknown;
  onOpen: (item: T) => void;
  setCenter: (n: number | ((c: number) => number)) => void;
  setExpanded: (open: boolean) => void;
}): {
  onWheel: (e: React.WheelEvent) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
} {
  const { items, center, expanded, expandable, onOpen, setCenter, setExpanded } = params;
  const clamp = (n: number) => Math.max(0, Math.min(items.length - 1, n));
  const drag = useRef<DragState>(null);

  const onKey = useEventCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      e.stopPropagation();
      setCenter((c) => clamp(c - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      e.stopPropagation();
      setCenter((c) => clamp(c + 1));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      if (expandable) setExpanded(true);
    } else if (e.key === "ArrowUp") {
      if (expanded) {
        e.preventDefault();
        e.stopPropagation();
        setExpanded(false);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      onOpen(items[center].obj);
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onKey]);

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const wheelDelta = typeof drag.current === "number" ? drag.current : 0;
      drag.current = wheelDelta + e.deltaX;
      if (drag.current > 60) {
        setCenter((c) => clamp(c + 1));
        drag.current = 0;
      } else if (drag.current < -60) {
        setCenter((c) => clamp(c - 1));
        drag.current = 0;
      }
    }
  };
  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, start: center };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || typeof drag.current !== "object") return;
    const d = e.clientX - drag.current.x;
    setCenter(clamp(drag.current.start - Math.round(d / 120)));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    drag.current = null;
  };

  return { onWheel, onPointerDown, onPointerMove, onPointerUp };
}
