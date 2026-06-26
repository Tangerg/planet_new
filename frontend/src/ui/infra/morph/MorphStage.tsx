import React from "react";
import type { RefObject } from "react";

import "./morph.css";
import { MorphFrozen } from "./context";
import { EASE, layerStyle, type Transition } from "./useMorphTransition";

type MorphStageProps = {
  /** The resident container ref the engine measures against. */
  viewRef: RefObject<HTMLDivElement | null>;
  /** Current screen key. */
  view: string;
  /** Live transition state from useMorphTransition (null = idle). */
  trans: Transition | null;
  /** Renders a screen by key — supplied by the consumer (keeps infra screen-agnostic). */
  renderScreen: (v: string) => React.ReactNode;
  /** Background for the flying tile, by (seed, grad) — injected so infra holds no art/vibe logic. */
  tileBg: (seed: number | undefined, grad: string[] | undefined) => string;
};

/**
 * The morph stage: the single resident container in which screens mount/unmount,
 * plus the transition layers (base / outgoing `t-from` / flying `grain` tile)
 * the engine drives. Lifted verbatim from Shell so the page-to-page transition
 * is reusable infra, not inlined in one screen. Visual classes (`.view`,
 * `.t-base`, `.t-from`, `.grain`) live in the design-system CSS.
 */
export function MorphStage({ viewRef, view, trans, renderScreen, tileBg }: MorphStageProps) {
  return (
    <div className="view" ref={viewRef}>
      {(() => {
        const fwd = trans && trans.dir === "fwd" && trans.point;
        const clipping = fwd && trans.hero !== true;
        const st: React.CSSProperties = { height: "100%" };
        if (clipping) {
          const started = trans.phase !== "start";
          const cp = `circle(${started ? trans.clipR : 0}px at ${trans.point.x}px ${trans.point.y}px)`;
          (st as any).clipPath = cp;
          (st as any).WebkitClipPath = cp;
          st.transition = started ? `clip-path .6s ${EASE}` : "none";
          st.position = "relative";
          st.zIndex = 25;
        }
        return (
          <div className="t-base" key={view} style={st}>
            {renderScreen(view)}
          </div>
        );
      })()}
      {trans && (
        <React.Fragment>
          {(() => {
            const fromStyle = layerStyle(trans);
            if (trans.dir === "rev" && trans.hero === false && trans.point) {
              const collapsed = trans.phase !== "start";
              const cp = `circle(${collapsed ? 0 : trans.clipR}px at ${trans.point.x}px ${trans.point.y}px)`;
              (fromStyle as any).clipPath = cp;
              (fromStyle as any).WebkitClipPath = cp;
              fromStyle.opacity = 1;
              fromStyle.transition = collapsed ? `clip-path .55s ${EASE}` : "none";
            }
            return (
              <div className="t-layer t-from" style={fromStyle}>
                <MorphFrozen>{renderScreen(trans.from)}</MorphFrozen>
              </div>
            );
          })()}
          {trans.hero !== false &&
            (() => {
              const t = trans;
              // FLIP: lay the tile out at the TARGET rect and never resize it —
              // translate+scale it onto the ORIGIN rect, then animate the transform
              // back. transform+opacity are the only compositor-only props (no
              // per-frame layout/paint), so the flight stays on the GPU instead of
              // re-laying-out the box + re-sampling the cover <img> every frame
              // (the old left/top/width/height tween thrashed layout in WKWebView).
              // border-radius is constant across the morph (0↔0 sharp, or 50%↔50%
              // circle after the shape unify), so it rides on the box, not the tween.
              const target = t.target ?? t.origin;
              const o = t.origin;
              const atOrigin = t.dir === "fwd" ? t.phase === "start" : t.phase !== "start";
              const flip =
                `translate(${o.left - target.left}px, ${o.top - target.top}px) ` +
                `scale(${o.width / target.width}, ${o.height / target.height})`;
              const op =
                t.dir === "fwd" ? (t.phase === "reveal" ? 0 : 1) : t.phase === "start" ? 1 : 0;
              const anim = t.phase !== "start";
              return (
                <div
                  className="grain"
                  aria-hidden
                  style={{
                    position: "absolute",
                    zIndex: 40,
                    pointerEvents: "none",
                    overflow: "hidden",
                    left: target.left,
                    top: target.top,
                    width: target.width,
                    height: target.height,
                    borderRadius: o.borderRadius,
                    transformOrigin: "0 0",
                    transform: atOrigin ? flip : "none",
                    willChange: "transform, opacity",
                    opacity: op,
                    background: tileBg(t.seed, t.grad),
                    boxShadow: "0 30px 70px -26px rgba(0,0,0,.5)",
                    transition: anim ? `transform .58s ${EASE}, opacity .34s ease` : "none",
                  }}
                >
                  {t.image && (
                    <img
                      src={t.image}
                      alt=""
                      draggable={false}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
              );
            })()}
        </React.Fragment>
      )}
    </div>
  );
}
