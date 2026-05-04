import type { StoreApi, UseBoundStore } from "zustand";

/**
 * 给 zustand store 添加 `use.<key>()` 形式的 selector，例如：
 *   `useFooStore.use.bar()`  等价于  `useFooStore((s) => s.bar)`。
 *
 * 比每处都写显式 selector 干净；ts 端 key 受 store state 类型约束。
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
    (store.use as Record<string, unknown>)[key] = () =>
      store((s) => s[key as keyof typeof s]);
  }
  return store;
}

/** 旧默认导出兼容：等价于 named `withSelectors` */
export default withSelectors;
