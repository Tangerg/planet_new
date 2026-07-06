import type React from "react";
import { useEffect, useRef } from "react";

import type { VibeCollection, VibeTrack } from "@/model/vibe";
import type { FlowItem } from "@/model/derive";
import {
  clampCoverFlowCenter,
  coverFlowDragCenter,
  coverFlowDragStarted,
  coverFlowKeyAction,
  coverFlowWheelMotion,
  nextCoverFlowCenter,
} from "@/model/cover-flow-input";
import { useEventCallback } from "@/hooks/useEventCallback";

// `drag` is dual-use: a number accumulates horizontal wheel delta, an object
// tracks an in-flight pointer press, null idle. `dragging` flips true only once
// the press travels past the click/drag threshold — until then the pointer is
// left UNCAPTURED so the press stays a click that reaches the card underneath.
type DragState = number | { x: number; start: number; pointerId: number; dragging: boolean } | null;

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
  const drag = useRef<DragState>(null);

  const onKey = useEventCallback((e: KeyboardEvent) => {
    const action = coverFlowKeyAction({
      key: e.key,
      expanded,
      expandable: Boolean(expandable),
    });
    if (action === "none") return;

    if (action === "previous") {
      e.preventDefault();
      e.stopPropagation();
      setCenter((c) => nextCoverFlowCenter(c, items.length, "previous"));
    } else if (action === "next") {
      e.preventDefault();
      e.stopPropagation();
      setCenter((c) => nextCoverFlowCenter(c, items.length, "next"));
    } else if (action === "expand") {
      e.preventDefault();
      e.stopPropagation();
      setExpanded(true);
    } else if (action === "collapse") {
      e.preventDefault();
      e.stopPropagation();
      setExpanded(false);
    } else if (action === "open") {
      const item = items[clampCoverFlowCenter(center, items.length)];
      if (item) {
        e.preventDefault();
        e.stopPropagation();
        onOpen(item.obj);
      }
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onKey]);

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const wheelDelta = typeof drag.current === "number" ? drag.current : 0;
      const motion = coverFlowWheelMotion(wheelDelta, e.deltaX);
      drag.current = motion.accumulatedDelta;
      if (motion.centerDelta !== 0) {
        setCenter((c) => clampCoverFlowCenter(c + motion.centerDelta, items.length));
      }
    }
  };
  const onPointerDown = (e: React.PointerEvent) => {
    // Do NOT capture yet: a plain click must reach the card / play fab. Capture
    // is deferred to onPointerMove once the press is confirmed a drag.
    drag.current = { x: e.clientX, start: center, pointerId: e.pointerId, dragging: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const state = drag.current;
    if (!state || typeof state !== "object") return;
    if (!state.dragging) {
      if (!coverFlowDragStarted(state.x, e.clientX)) return;
      // Confirmed drag: capture now so it survives the pointer leaving the rail,
      // and let the follow-up click be swallowed (a drag must not activate a card).
      state.dragging = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(state.pointerId);
    }
    setCenter(
      coverFlowDragCenter({
        currentX: e.clientX,
        itemCount: items.length,
        startCenter: state.start,
        startX: state.x,
      }),
    );
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const state = drag.current;
    if (state && typeof state === "object" && state.dragging) {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(state.pointerId);
    }
    drag.current = null;
  };

  return { onWheel, onPointerDown, onPointerMove, onPointerUp };
}
