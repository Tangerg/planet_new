import { useEffect, useRef } from "react";

import {
  type XmbInputIntent,
  type XmbItemModel,
  xmbKeyboardIntent,
  xmbWheelNavigation,
} from "@/model/navigation";
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

  const applyIntent = (intent: XmbInputIntent) => {
    if (intent === "category-previous") move(-1);
    else if (intent === "category-next") move(1);
    else if (intent === "row-previous") setItem(it - 1);
    else if (intent === "row-next") setItem(it + 1);
    else if (intent === "open" && item) {
      const node = document.querySelector("[data-xmb-active-art]");
      if (onOpen && node) onOpen(item, node.getBoundingClientRect());
      else if (item.run) item.run();
    }
  };

  const onKey = useEventCallback((e: KeyboardEvent) => {
    const intent = xmbKeyboardIntent(e.key);
    if (intent === "none") return;
    e.preventDefault();
    applyIntent(intent);
  });

  // trackpad / wheel: horizontal swipe changes category, vertical changes item
  const onWheel = useEventCallback((e: WheelEvent) => {
    const now = Date.now();
    const navigation = xmbWheelNavigation({
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      nextAllowedAt: wheelRef.current,
      now,
    });
    wheelRef.current = navigation.nextAllowedAt;
    applyIntent(navigation.intent);
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
