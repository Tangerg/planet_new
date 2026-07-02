import { useEffect, useRef } from "react";

import type { XmbItemModel } from "@/model/navigation";
import { useEventCallback } from "@/hooks/useEventCallback";

/**
 * Window-level keyboard + trackpad driving for the XMB launcher: arrows and
 * horizontal/vertical wheel move the category / item cursor, Enter opens the
 * active item (anchored to its `[data-xmb-active-art]` node so the morph engine
 * measures the right rect). The listeners install once (stable handlers) yet
 * always act on the latest cursor state — see useEventCallback.
 */
export function useXmbKeyboard(params: {
  it: number;
  item: XmbItemModel | undefined;
  onOpen?: (m: XmbItemModel, rect: DOMRect) => void;
  move: (delta: number) => void;
  setItem: (index: number) => void;
}): void {
  const { it, item, onOpen, move, setItem } = params;
  const wheelRef = useRef(0);

  const onKey = useEventCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setItem(it - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setItem(it + 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (item) {
        const node = document.querySelector("[data-xmb-active-art]");
        if (onOpen && node) onOpen(item, node.getBoundingClientRect());
        else if (item.run) item.run();
      }
    }
  });

  // trackpad / wheel: horizontal swipe changes category, vertical changes item
  const onWheel = useEventCallback((e: WheelEvent) => {
    const now = Date.now();
    if (now < wheelRef.current) return;
    const ax = Math.abs(e.deltaX),
      ay = Math.abs(e.deltaY);
    if (Math.max(ax, ay) < 6) return;
    if (ax > ay + 2) move(e.deltaX > 0 ? 1 : -1);
    else setItem(it + (e.deltaY > 0 ? 1 : -1));
    wheelRef.current = now + 250;
  });

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
    };
  }, [onKey, onWheel]);
}
