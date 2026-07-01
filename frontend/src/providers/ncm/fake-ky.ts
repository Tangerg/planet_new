import type { KyInstance } from "ky";

/**
 * Test-only stand-in for a ky instance. Modules under `ncm/` do HTTP via
 * `http.get(path, { searchParams }).json<T>()` and occasionally `await
 * http.get(...)` directly, so the returned handle is both awaitable and exposes
 * `.json()`. Resolution is lazy (only when awaited / `.json()` / `.catch()`), so
 * a route that throws rejects exactly one consumer — exercising the modules'
 * `.catch()` fallbacks without leaking unhandled rejections.
 *
 * A route may be a plain value or a function of the request's searchParams
 * (for pagination or echoing the query back).
 */
export type FakeRoute = unknown | ((searchParams: Record<string, unknown>) => unknown);

export type FakeCall = { path: string; searchParams: Record<string, unknown> };

export function fakeKy(routes: Record<string, FakeRoute>): {
  http: KyInstance;
  calls: FakeCall[];
} {
  const calls: FakeCall[] = [];
  const get = (path: string, opts?: { searchParams?: Record<string, unknown> }) => {
    const searchParams = opts?.searchParams ?? {};
    calls.push({ path, searchParams });
    const run = () => {
      if (!(path in routes)) throw new Error(`fakeKy: no route for "${path}"`);
      const route = routes[path];
      return typeof route === "function"
        ? (route as (sp: Record<string, unknown>) => unknown)(searchParams)
        : route;
    };
    // Intentionally thenable: ky's ResponsePromise is awaitable *and* exposes
    // .json(); some call sites `await http.get(...)` directly. Resolution stays
    // lazy so a throwing route rejects only the one consumer that reads it.
    return {
      // eslint-disable-next-line unicorn/no-thenable
      then: (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) =>
        Promise.resolve().then(run).then(onF, onR),
      catch: (onR: (e: unknown) => unknown) => Promise.resolve().then(run).catch(onR),
      json: () => Promise.resolve().then(run),
    };
  };
  return { http: { get } as unknown as KyInstance, calls };
}
