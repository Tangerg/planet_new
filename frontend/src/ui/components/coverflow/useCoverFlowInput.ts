import type React from "react";
import { useEffect, useRef } from "react";

import type { VibeCollection, VibeTrack } from "@/model/vibe";
import type { FlowItem } from "@/model/derive";
import {
  clampCoverFlowCenter,
  coverFlowDragCenter,
  coverFlowKeyAction,
  coverFlowWheelMotion,
  nextCoverFlowCenter,
} from "@/model/cover-flow-input";
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
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, start: center };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || typeof drag.current !== "object") return;
    setCenter(
      coverFlowDragCenter({
        currentX: e.clientX,
        itemCount: items.length,
        startCenter: drag.current.start,
        startX: drag.current.x,
      }),
    );
  };
  const onPointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    drag.current = null;
  };

  return { onWheel, onPointerDown, onPointerMove, onPointerUp };
}
