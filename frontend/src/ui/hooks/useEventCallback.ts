import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * A callback with a stable identity that always invokes the latest closure.
 *
 * For handlers attached to long-lived listeners (a `window` keydown/wheel bound
 * once in an effect): the returned function never changes, so the listener
 * installs a single time, yet it still sees the freshest props/state — no manual
 * "sync a ref every render" boilerplate, and no stale closures.
 *
 * Do not call the returned function during render (only from effects/handlers);
 * the latest closure is committed in a layout effect.
 */
export function useEventCallback<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: A) => ref.current(...args), []);
}
