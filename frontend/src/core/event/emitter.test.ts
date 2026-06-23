import { expect, test, vi } from "vitest";

import { EventEmitter } from "./emitter";

test("on-listeners fire on every emit; once-listeners fire only once", () => {
  const em = new EventEmitter<{ test: void }>();
  const a = vi.fn<() => void>();
  const b = vi.fn<() => void>();
  const onceFn = vi.fn<() => void>();

  em.on("test", a);
  em.on("test", b);
  em.once("test", onceFn);

  em.emit("test");
  em.emit("test");
  em.emit("test");

  expect(a).toHaveBeenCalledTimes(3);
  expect(b).toHaveBeenCalledTimes(3);
  expect(onceFn).toHaveBeenCalledTimes(1);
});

test("off removes one listener; clear removes all", () => {
  const em = new EventEmitter<{ test: void }>();
  const keep = vi.fn<() => void>();
  const drop = vi.fn<() => void>();

  em.on("test", keep);
  em.on("test", drop);
  em.off("test", drop);
  em.emit("test");
  expect(keep).toHaveBeenCalledTimes(1);
  expect(drop).not.toHaveBeenCalled();

  em.clear();
  em.emit("test");
  expect(keep).toHaveBeenCalledTimes(1);
});
