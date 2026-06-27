import type { KeyboardEvent, KeyboardEventHandler } from "react";

/**
 * The keyboard half of a `role="button"` element: activate on Enter or Space,
 * preventing Space from scrolling. Pair it with the element's `onClick` so mouse
 * and keyboard share one activation path:
 *
 *   <div role="button" tabIndex={0} onClick={go} onKeyDown={activateOnKey(go)} />
 *
 * (For real app-level shortcuts use TanStack Hotkeys; this is per-element a11y
 * activation, not a global shortcut.)
 */
export function activateOnKey<T extends Element = Element>(
  handler: (e: KeyboardEvent<T>) => void,
): KeyboardEventHandler<T> {
  return (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler(e);
    }
  };
}
