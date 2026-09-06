import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach } from "vitest";

// https://testing-library.com/docs/react-testing-library/api#cleanup
afterEach(() => cleanup());

/*
 * Clear intervals that outlive the environment that owns them.
 *
 * A module can start a timer at import and keep the only handle to it. The Wails
 * runtime does exactly that: seeing a DOM, it begins polling every 50ms for a
 * host that never arrives under jsdom, and gives up only after five seconds. Any
 * test file that reaches the generated bindings imports it. When such a file
 * finishes sooner than that — most do — the next tick runs against a torn-down
 * environment and throws `window is not defined` as an UNCAUGHT error, which
 * fails the whole run. Nothing in the suite is wrong, and which file it lands on
 * is a matter of timing, so the failure looks random.
 *
 * The suite owns the environment's lifetime, so it also has to end what is still
 * running when that lifetime does. Patched here, before any test module is
 * imported, so an interval started at import time is recorded too.
 */
const liveIntervals = new Set<ReturnType<typeof setInterval>>();
const startInterval = globalThis.setInterval;

globalThis.setInterval = ((...args: Parameters<typeof setInterval>) => {
  const id = startInterval(...args);
  liveIntervals.add(id);
  return id;
}) as typeof globalThis.setInterval;

afterAll(() => {
  for (const id of liveIntervals) clearInterval(id);
  liveIntervals.clear();
});
