/**
 * Shared-element transition engine — the morph phase machine that flies a
 * tile onto the destination hero and back. The page-to-page (navigation)
 * transition system, ported verbatim from the example Sonance Vibe App.
 *
 * UI-layer infra (`@/infra/morph`): framework of the transition only — it holds
 * no vibe/screen knowledge. Consumers drive it with a `view` string + setView,
 * trigger forward/reverse, and render screens themselves (see MorphStage, which
 * paints the resident container + base/from/grain layers from this state).
 * In-page animation is a separate concern (use Motion for that); this owns the
 * cross-screen morph.
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
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import type { MorphFn } from "./context";

export const EASE = "cubic-bezier(.16,1,.3,1)";

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
  borderRadius: number | string;
};

export type Transition = {
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

/** Style for the outgoing-screen layer (`.t-from`): fades + blurs out, unless
 *  it's the start frame or a clip reveal (`hero === false`). Pure fn of EASE. */
export function layerStyle(t: Transition): React.CSSProperties {
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
}

export function useMorphTransition(
  viewRef: RefObject<HTMLDivElement | null>,
  view: string,
  setView: (v: string) => void,
) {
  const [trans, setTrans] = useState<Transition | null>(null);
  const lastTile = useRef<any>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafIds = useRef<number[]>([]);

  const reduceMo = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const clearAll = useCallback(() => {
    clearTimers();
    rafIds.current.forEach((id) => cancelAnimationFrame(id));
    rafIds.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      rafIds.current.forEach((id) => cancelAnimationFrame(id));
    };
  }, []);

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

  const startForward = useCallback(
    (item: any, rect: DOMRect) => {
      if (!viewRef.current || reduceMo()) {
        if (item.run) item.run();
        return;
      }
      clearAll();
      const o = relRect(rect);
      // Round sources (artist circles) pass radius "50%" so the tile flies as a
      // circle the whole way; default to a small square radius otherwise.
      const origin = { ...o, borderRadius: item.radius ?? 6 };
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
    },
    [view],
  );

  const startReverse = useCallback(() => {
    const lt = lastTile.current;
    const from = view;
    if (!viewRef.current || !lt || reduceMo()) {
      setView("xmb");
      return;
    }
    clearAll();
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
    const revId1 = requestAnimationFrame(() => {
      const revId2 = requestAnimationFrame(() =>
        setTrans((t) => (t && t.phase === "start" ? { ...t, phase: "morph" } : t)),
      );
      rafIds.current.push(revId2);
    });
    rafIds.current.push(revId1);
    timers.current.push(setTimeout(() => setTrans(null), 760));
  }, [view]);

  // Stable rect-based morph trigger for deep consumers (cards/rows), exposed via
  // the MorphProvider context — not a window global. startForward is recreated
  // each render (curated deps), so route through a ref to keep `morph` stable.
  const goMorph: MorphFn = (rect, seed, grad, run, image, radius) =>
    startForward({ seed, grad, dest: "_", run, image, radius }, rect);
  const goMorphRef = useRef(goMorph);
  goMorphRef.current = goMorph;
  const morph = useCallback<MorphFn>(
    (rect, seed, grad, run, image, radius) =>
      goMorphRef.current(rect, seed, grad, run, image, radius),
    [],
  );

  // Measure the destination hero once the new screen mounts.
  useLayoutEffect(() => {
    if (!trans || trans.dir !== "fwd" || trans.measured) return;
    const hero = heroRect(".t-base [data-hero]");
    setTrans((t) => t && { ...t, target: hero || t.target, hero: !!hero, measured: true });
  }, [trans]);

  // Advance the forward transition to the morph phase.
  useEffect(() => {
    if (!trans || trans.dir !== "fwd" || !trans.measured || trans.phase !== "start") return;
    const outer = requestAnimationFrame(() => {
      const inner = requestAnimationFrame(() =>
        setTrans((t) => (t && t.phase === "start" ? { ...t, phase: "morph" } : t)),
      );
      rafIds.current.push(inner);
    });
    rafIds.current.push(outer);
    return () => {
      cancelAnimationFrame(outer);
      rafIds.current = rafIds.current.filter((id) => id !== outer);
      // Cancel any inner rAFs that may have already been scheduled
      rafIds.current.forEach((id) => cancelAnimationFrame(id));
      rafIds.current = [];
    };
  }, [trans]);

  // Esc/back are owned by Shell's goBack so they share the navigation
  // back-stack (pop one level) instead of always collapsing to the launcher.

  // lastTile is exposed so the consumer's back-stack can snapshot/restore it: a
  // card morph overwrites it, so without per-level restore the eventual
  // collapse-to-launcher would fly from the wrong origin tile.
  // (layerStyle/EASE are module exports; `morph` is the stable trigger the Shell
  // feeds into MorphProvider for deep consumers.)
  return { trans, startForward, startReverse, lastTile, morph };
}
