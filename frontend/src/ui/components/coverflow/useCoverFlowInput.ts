import type React from "react";
import { useEffect, useRef } from "react";

import { clampIndex } from "@shared/number";

import type { VibeCollection, VibeTrack } from "@/model/vibe";
import type { FlowItem } from "@/model/derive";
import {
  coverFlowDragCenter,
  coverFlowDragStarted,
  coverFlowKeyAction,
  coverFlowWheelMotion,
  nextCoverFlowCenter,
} from "@/model/cover-flow-input";
import { useEventCallback } from "@/hooks/useEventCallback";

type DragState = number | { x: number; start: number; pointerId: number; dragging: boolean } | null;

export function useCoverFlowInput<T extends VibeTrack | VibeCollection>(params: {
  items: FlowItem<T>[];
  center: number;
  expanded: boolean;
  canExpand: boolean;
  onOpen: (item: T) => void;
  setCenter: (n: number | ((c: number) => number)) => void;
  setExpanded: (open: boolean) => void;
}): {
  onWheel: (e: React.WheelEvent) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
} {
  const { items, center, expanded, canExpand, onOpen, setCenter, setExpanded } = params;
  const drag = useRef<DragState>(null);

  const onKey = useEventCallback((e: KeyboardEvent) => {
    const action = coverFlowKeyAction({ key: e.key, expanded, expandable: canExpand });
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
      const item = items[clampIndex(center, items.length)];
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
        setCenter((c) => clampIndex(c + motion.centerDelta, items.length));
      }
    }
  };
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, start: center, pointerId: e.pointerId, dragging: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const state = drag.current;
    if (!state || typeof state !== "object") return;
    if (!state.dragging) {
      if (!coverFlowDragStarted(state.x, e.clientX)) return;
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
