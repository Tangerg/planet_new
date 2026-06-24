/**
 * Shared-element transition engine — the morph phase machine that flies a
 * tile onto the destination hero and back. Ported verbatim from the example
 * Sonance Vibe App; extracted from Shell.tsx for separation of concerns.
 *
 * The dep arrays are intentionally curated (keyed on `view` / `trans`); the
 * referenced callbacks are recreated each render by design. Adding them to
 * deps would re-run the morph effects every frame and break the transition.
 */
/* eslint-disable react-hooks/exhaustive-deps --
   The shared-element transition engine uses intentionally curated dependency
   arrays. The referenced callbacks are recreated each render by design;
   adding them would re-run the morph effects every frame and break the
   transition. This is a verbatim port whose exact dep arrays ARE the contract. */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
  borderRadius: number | string;
};

type Transition = {
  from: string;
  to: string;
  origin: Rect;
  target: Rect | null;
  point: { x: number; y: number };
  clipR: number;
  seed: number | undefined;
  grad: string[] | undefined;
  image: string | undefined;
  dir: "fwd" | "rev";
  phase: "start" | "reveal" | "morph";
  hero: boolean | null;
  measured: boolean;
};

export function useMorphTransition(
  viewRef: RefObject<HTMLDivElement | null>,
  view: string,
  setView: (v: string) => void,
) {
  const [trans, setTrans] = useState<Transition | null>(null);
  const lastTile = useRef<any>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const reduceMo = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const relRect = (r: DOMRect): Rect => {
    const v = viewRef.current!.getBoundingClientRect();
    return {
      left: r.left - v.left,
      top: r.top - v.top,
      width: r.width,
      height: r.height,
      borderRadius: 0,
    };
  };

  const fullRect = (): Rect => {
    const v = viewRef.current!.getBoundingClientRect();
    return { left: 0, top: 0, width: v.width, height: v.height, borderRadius: 0 };
  };

  const heroRect = (sel: string): Rect | null => {
    const root = viewRef.current;
    if (!root) return null;
    const el = root.querySelector(sel);
    if (!el) return null;
    const r: Rect = relRect(el.getBoundingClientRect());
    const br = getComputedStyle(el).borderTopLeftRadius;
    r.borderRadius = br && br !== "0px" ? br : 0;
    return r;
  };

  const startForward = (item: any, rect: DOMRect) => {
    if (!viewRef.current || reduceMo()) {
      if (item.run) item.run();
      return;
    }
    clearTimers();
    const o = relRect(rect);
    const origin = { ...o, borderRadius: 6 };
    const vw = viewRef.current.getBoundingClientRect();
    const px = o.left + o.width / 2,
      py = o.top + o.height / 2;
    const clipR = Math.hypot(Math.max(px, vw.width - px), Math.max(py, vw.height - py));
    lastTile.current = { origin, seed: item.seed, grad: item.grad, image: item.image };
    if (item.run) item.run();
    setTrans({
      from: view,
      to: item.dest,
      origin,
      target: fullRect(),
      point: { x: px, y: py },
      clipR,
      seed: item.seed,
      grad: item.grad,
      image: item.image,
      dir: "fwd",
      phase: "start",
      hero: null,
      measured: false,
    });
    timers.current.push(setTimeout(() => setTrans((t) => t && { ...t, phase: "reveal" }), 620));
    timers.current.push(setTimeout(() => setTrans(null), 1000));
  };

  const startReverse = () => {
    const lt = lastTile.current;
    const from = view;
    if (!viewRef.current || !lt || reduceMo()) {
      setView("xmb");
      return;
    }
    clearTimers();
    const src = heroRect(".t-base [data-hero]");
    const o = lt.origin;
    const vw = viewRef.current.getBoundingClientRect();
    const px = o.left + o.width / 2,
      py = o.top + o.height / 2;
    const clipR = Math.hypot(Math.max(px, vw.width - px), Math.max(py, vw.height - py));
    setTrans({
      from,
      to: "xmb",
      origin: lt.origin,
      target: src || fullRect(),
      point: { x: px, y: py },
      clipR,
      seed: lt.seed,
      grad: lt.grad,
      image: lt.image,
      dir: "rev",
      phase: "start",
      hero: !!src,
      measured: true,
    });
    setView("xmb");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setTrans((t) => t && { ...t, phase: "morph" })),
    );
    timers.current.push(setTimeout(() => setTrans(null), 760));
  };

  const goMorph = (
    rect: DOMRect,
    seed?: number,
    grad?: string[],
    run?: () => void,
    image?: string,
  ) => startForward({ seed, grad, dest: "_", run, image }, rect);

  useEffect(() => {
    window.__MORPH = goMorph as any;
    return () => {
      window.__MORPH = undefined;
    };
  });

  const layerStyle = (t: Transition): React.CSSProperties => {
    const begin = t.phase === "start" || t.hero === false;
    return {
      position: "absolute",
      inset: 0,
      height: "100%",
      pointerEvents: "none",
      zIndex: 20,
      opacity: begin ? 1 : 0,
      transform: begin ? "scale(1)" : "scale(.985)",
      filter: begin ? "blur(0px)" : "blur(3px)",
      transformOrigin: "center",
      transition: begin ? "none" : `opacity .32s ease, transform .46s ${EASE}, filter .46s ${EASE}`,
    };
  };

  // Measure the destination hero once the new screen mounts.
  useLayoutEffect(() => {
    if (!trans || trans.dir !== "fwd" || trans.measured) return;
    const hero = heroRect(".t-base [data-hero]");
    setTrans((t) => t && { ...t, target: hero || t.target, hero: !!hero, measured: true });
  }, [trans]);

  // Advance the forward transition to the morph phase.
  useEffect(() => {
    if (!trans || trans.dir !== "fwd" || !trans.measured || trans.phase !== "start") return;
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setTrans((t) => (t && t.phase === "start" ? { ...t, phase: "morph" } : t)),
      ),
    );
    return () => cancelAnimationFrame(id);
  }, [trans]);

  // Esc returns to launcher.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && view !== "xmb") startReverse();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);

  return { trans, startForward, startReverse, goMorph, layerStyle, EASE };
}
