/* eslint-disable react-hooks/exhaustive-deps --
   The shared-element transition engine uses intentionally curated dependency
   arrays. The referenced callbacks are recreated each render by design;
   adding them would re-run the morph effects every frame and break the
   transition. This is a verbatim port whose exact dep arrays ARE the contract. */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import type { MorphFn } from "./context";

export const MORPH_SEC = 0.48;
export const MORPH_MS = MORPH_SEC * 1000;
export const MORPH_REVEAL_MS = MORPH_MS + 20;
export const MORPH_CLEAR_MS = 760;
export const MORPH_FAILSAFE_MS = 1200;
export const MORPH_LAYER_FADE_SEC = 0.24;

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
  borderRadius: number | string;
};

export type MorphLastTile = {
  origin: Rect;
  seed?: number;
  grad?: string[];
  image?: string;
};

export type Transition<V extends string = string> = {
  from: V;
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

export function layerStyle(t: Transition<string>): React.CSSProperties {
  const begin = t.phase === "start" || t.hero === false;
  return {
    position: "absolute",
    inset: 0,
    height: "100%",
    pointerEvents: "none",
    zIndex: 20,
    opacity: begin ? 1 : 0,
    willChange: "opacity",
    transition: begin ? "none" : `opacity ${MORPH_LAYER_FADE_SEC}s ease`,
  };
}

export function useMorphTransition<V extends string>(
  viewRef: RefObject<HTMLDivElement | null>,
  view: V,
  setView: (v: V) => void,
  launcherView: V,
) {
  const [trans, setTrans] = useState<Transition<V> | null>(null);
  const transRef = useRef<Transition<V> | null>(null);
  const lastTile = useRef<MorphLastTile | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafIds = useRef<number[]>([]);
  const transitionRun = useRef(0);
  transRef.current = trans;

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

  const abortTransition = useCallback(() => {
    transitionRun.current++;
    clearAll();
    transRef.current = null;
    setTrans(null);
  }, [clearAll]);

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

  const startForward = useCallback<MorphFn>(
    (item, rect) => {
      if (transRef.current) {
        abortTransition();
        item.run?.();
        return;
      }
      if (!viewRef.current || reduceMo()) {
        if (item.run) item.run();
        return;
      }
      clearAll();
      const o = relRect(rect);
      const origin = { ...o, borderRadius: item.radius ?? 0 };
      const vw = viewRef.current.getBoundingClientRect();
      const px = o.left + o.width / 2,
        py = o.top + o.height / 2;
      const clipR = Math.hypot(Math.max(px, vw.width - px), Math.max(py, vw.height - py));
      lastTile.current = { origin, seed: item.seed, grad: item.grad, image: item.image };
      if (item.run) item.run();
      const next: Transition<V> = {
        from: view,
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
      };
      const runId = ++transitionRun.current;
      transRef.current = next;
      setTrans(next);
      timers.current.push(
        setTimeout(() => {
          if (transitionRun.current !== runId) return;
          transRef.current = null;
          setTrans(null);
        }, MORPH_FAILSAFE_MS),
      );
    },
    [view],
  );

  const startReverse = useCallback(() => {
    if (transRef.current) {
      abortTransition();
      setView(launcherView);
      return;
    }
    const lt = lastTile.current;
    const from = view;
    if (!viewRef.current || !lt || reduceMo()) {
      setView(launcherView);
      return;
    }
    clearAll();
    const src = heroRect(".t-base [data-hero]");
    const o = lt.origin;
    const vw = viewRef.current.getBoundingClientRect();
    const px = o.left + o.width / 2,
      py = o.top + o.height / 2;
    const clipR = Math.hypot(Math.max(px, vw.width - px), Math.max(py, vw.height - py));
    const next: Transition<V> = {
      from,
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
    };
    const runId = ++transitionRun.current;
    transRef.current = next;
    setTrans(next);
    setView(launcherView);
    timers.current.push(
      setTimeout(() => {
        if (transitionRun.current !== runId) return;
        transRef.current = null;
        setTrans(null);
      }, 1400),
    );
    const revId1 = requestAnimationFrame(() => {
      const revId2 = requestAnimationFrame(() => {
        if (transitionRun.current !== runId) return;
        setTrans((t) => (t && t.phase === "start" ? { ...t, phase: "morph" } : t));
        timers.current.push(
          setTimeout(() => {
            if (transitionRun.current !== runId) return;
            transRef.current = null;
            setTrans(null);
          }, MORPH_CLEAR_MS),
        );
      });
      rafIds.current.push(revId2);
    });
    rafIds.current.push(revId1);
  }, [view]);

  const startForwardRef = useRef(startForward);
  startForwardRef.current = startForward;
  const morph = useCallback<MorphFn>((source, rect) => startForwardRef.current(source, rect), []);

  useLayoutEffect(() => {
    if (!trans || trans.dir !== "fwd" || trans.measured) return;
    const hero = heroRect(".t-base [data-hero]");
    setTrans((t) => t && { ...t, target: hero || t.target, hero: !!hero, measured: true });
  }, [trans]);

  useEffect(() => {
    if (!trans || trans.dir !== "fwd" || !trans.measured || trans.phase !== "start") return;
    const runId = transitionRun.current;
    const outer = requestAnimationFrame(() => {
      const inner = requestAnimationFrame(() => {
        if (transitionRun.current !== runId) return;
        setTrans((t) => (t && t.phase === "start" ? { ...t, phase: "morph" } : t));
        timers.current.push(
          setTimeout(() => {
            if (transitionRun.current !== runId) return;
            setTrans((t) => t && { ...t, phase: "reveal" });
          }, MORPH_REVEAL_MS),
        );
        timers.current.push(
          setTimeout(() => {
            if (transitionRun.current !== runId) return;
            transRef.current = null;
            setTrans(null);
          }, MORPH_CLEAR_MS),
        );
      });
      rafIds.current.push(inner);
    });
    rafIds.current.push(outer);
    return () => {
      cancelAnimationFrame(outer);
      rafIds.current = rafIds.current.filter((id) => id !== outer);
      rafIds.current.forEach((id) => cancelAnimationFrame(id));
      rafIds.current = [];
    };
  }, [trans]);

  const readLastTile = useCallback(() => lastTile.current, []);
  const restoreLastTile = useCallback((tile: MorphLastTile | null) => {
    lastTile.current = tile;
  }, []);

  return { trans, startForward, startReverse, readLastTile, restoreLastTile, morph };
}
