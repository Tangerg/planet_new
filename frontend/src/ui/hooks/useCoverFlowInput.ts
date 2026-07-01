import type React from "react";
import { useEffect, useRef } from "react";

import type { VibeCollection, VibeTrack } from "@/model/adapt";
import type { FlowItem } from "@/model/derive";

// `drag` is dual-use: a number accumulates horizontal wheel delta, an object
// tracks an in-flight pointer drag (start pointer x + start center), null idle.
type DragState = number | { x: number; start: number } | null;

/**
 * Input driving for the CoverFlow carousel — keyboard (window, capture phase so
 * it wins over global spatial-nav), horizontal wheel, and pointer drag. Arrows
 * move the center / expand the tracklist, Enter opens the centered item. Latest
 * state is read through refs so the window listener installs once; the returned
 * pointer handlers close over live values for the root element.
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
  // refs capture latest values for the stable window listener below
  const centerRef = useRef(center);
  const expandedRef = useRef(expanded);
  const itemsRef = useRef(items);
  const expandableRef = useRef(expandable);
  const onOpenRef = useRef(onOpen);
  const setExpandedRef = useRef(setExpanded);
  const setCenterRef = useRef(setCenter);
  // sync refs every render so the stable event handler always reads latest values
  centerRef.current = center;
  expandedRef.current = expanded;
  itemsRef.current = items;
  expandableRef.current = expandable;
  onOpenRef.current = onOpen;
  setExpandedRef.current = setExpanded;
  setCenterRef.current = setCenter;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        setCenterRef.current((c: number) =>
          Math.max(0, Math.min(itemsRef.current.length - 1, c - 1)),
        );
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        setCenterRef.current((c: number) =>
          Math.max(0, Math.min(itemsRef.current.length - 1, c + 1)),
        );
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        if (expandableRef.current) setExpandedRef.current(true);
      } else if (e.key === "ArrowUp") {
        if (expandedRef.current) {
          e.preventDefault();
          e.stopPropagation();
          setExpandedRef.current(false);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        onOpenRef.current(itemsRef.current[centerRef.current].obj);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

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
