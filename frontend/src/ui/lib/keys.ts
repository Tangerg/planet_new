import type { KeyboardEvent, KeyboardEventHandler } from "react";

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
