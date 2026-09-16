import type { StoreApi, UseBoundStore } from "zustand";

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
