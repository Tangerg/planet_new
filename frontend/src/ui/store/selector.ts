import type { StoreApi, UseBoundStore } from "zustand";

/**
 * Adds `use.<key>()` selectors to a zustand store, e.g.
 *   `useFooStore.use.bar()` is equivalent to `useFooStore((s) => s.bar)`.
 *
 * Cleaner than an explicit selector at every call site; keys are constrained by
 * the store state type.
 */
type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

export function withSelectors<S extends UseBoundStore<StoreApi<object>>>(
  base: S,
): WithSelectors<S> {
  const store = base as WithSelectors<S>;
  store.use = {} as WithSelectors<S>["use"];
  for (const key of Object.keys(store.getState())) {
    (store.use as Record<string, unknown>)[key] = () => store((s) => s[key as keyof typeof s]);
  }
  return store;
}
