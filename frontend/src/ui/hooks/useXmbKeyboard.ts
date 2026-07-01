import { useEffect, useRef } from "react";

import type { XmbItemModel } from "@/model/navigation";

/**
 * Window-level keyboard + trackpad driving for the XMB launcher: arrows and
 * horizontal/vertical wheel move the category / item cursor, Enter opens the
 * active item (anchored to its `[data-xmb-active-art]` node so the morph engine
 * measures the right rect). Listeners install once; latest state is read through
 * refs so the handlers stay stable and don't rebind on every cursor move.
 */
export function useXmbKeyboard(params: {
  it: number;
  item: XmbItemModel | undefined;
  onOpen?: (m: XmbItemModel, rect: DOMRect) => void;
  move: (delta: number) => void;
  setItem: (index: number) => void;
}): void {
  const wheelRef = useRef(0);
  const itRef = useRef(params.it);
  const itemRef = useRef(params.item);
  const onOpenRef = useRef(params.onOpen);
  const moveRef = useRef(params.move);
  const setItemRef = useRef(params.setItem);
  // sync refs every render so the stable event handlers always read latest values
  itRef.current = params.it;
  itemRef.current = params.item;
  onOpenRef.current = params.onOpen;
  moveRef.current = params.move;
  setItemRef.current = params.setItem;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveRef.current(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        moveRef.current(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setItemRef.current(itRef.current - 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setItemRef.current(itRef.current + 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (itemRef.current) {
          const node = document.querySelector("[data-xmb-active-art]");
          if (onOpenRef.current && node)
            onOpenRef.current(itemRef.current, node.getBoundingClientRect());
          else if (itemRef.current.run) itemRef.current.run();
        }
      }
    };
    // trackpad / wheel: horizontal swipe changes category, vertical changes item
    const onWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now < wheelRef.current) return;
      const ax = Math.abs(e.deltaX),
        ay = Math.abs(e.deltaY);
      if (Math.max(ax, ay) < 6) return;
      if (ax > ay + 2) moveRef.current(e.deltaX > 0 ? 1 : -1);
      else setItemRef.current(itRef.current + (e.deltaY > 0 ? 1 : -1));
      wheelRef.current = now + 250;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);
}
