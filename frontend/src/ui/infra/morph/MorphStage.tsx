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
 * A border-radius (px number, "<n>px", or "<n>%") as a percentage of the given
 * box edge, clamped to [0,50]. The flying tile tweens its radius as a scale-stable
 * PERCENTAGE so a shape change between the two heroes (square 0% ↔ circle 50%, or
 * rounded ↔ sharp) morphs smoothly while the FLIP transform scales the box —
 * instead of snapping at the handoff. When both ends share a shape it's a no-op
 * (equal % → no border-radius repaint), so the common sharp→sharp case stays free.
 */
function radiusPct(r: number | string, size: number): number {
  const n = typeof r === "number" ? r : parseFloat(r) || 0;
  if (typeof r === "string" && r.trim().endsWith("%")) return Math.min(50, n);
  return size > 0 ? Math.min(50, (n / size) * 100) : 0;
}

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
        // The destination hero is the shared element the flying tile represents,
        // so keep it hidden while the tile is in flight — otherwise the cover
        // shows twice (parked at the target + the one in transit). Revealed at
        // "reveal", exactly as the tile fades out, for a seamless handoff.
        const hideHero = fwd && trans.hero !== false && trans.phase !== "reveal";
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
          <div className={hideHero ? "t-base t-hide-hero" : "t-base"} key={view} style={st}>
            {renderScreen(view)}
          </div>
        );
      })()}
      {trans && (
        <React.Fragment>
          {(() => {
            const fromStyle = layerStyle(trans);
            // On reverse, the outgoing hero is the shared element the tile carries
            // back to the card, so hide it for the whole reverse — the tile starts
            // exactly over it (so there's no flash) and represents it the rest of
            // the way.
            const hideFromHero = trans.dir === "rev" && trans.hero === true;
            if (trans.dir === "rev" && trans.hero === false && trans.point) {
              const collapsed = trans.phase !== "start";
              const cp = `circle(${collapsed ? 0 : trans.clipR}px at ${trans.point.x}px ${trans.point.y}px)`;
              (fromStyle as any).clipPath = cp;
              (fromStyle as any).WebkitClipPath = cp;
              fromStyle.opacity = 1;
              fromStyle.transition = collapsed ? `clip-path .55s ${EASE}` : "none";
            }
            return (
              <div
                className={hideFromHero ? "t-layer t-from t-hide-hero" : "t-layer t-from"}
                style={fromStyle}
              >
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
              // border-radius tweens too, but as a scale-stable PERCENTAGE so a
              // shape change between the two heroes (square↔circle, rounded↔sharp)
              // morphs smoothly; equal shapes → equal % → no-op (no repaint).
              const target = t.target ?? t.origin;
              const o = t.origin;
              const atOrigin = t.dir === "fwd" ? t.phase === "start" : t.phase !== "start";
              const flip =
                `translate(${o.left - target.left}px, ${o.top - target.top}px) ` +
                `scale(${o.width / target.width}, ${o.height / target.height})`;
              const radius = atOrigin
                ? radiusPct(o.borderRadius, o.width)
                : radiusPct(target.borderRadius, target.width);
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
                    borderRadius: `${radius}%`,
                    transformOrigin: "0 0",
                    transform: atOrigin ? flip : "none",
                    willChange: "transform, opacity",
                    opacity: op,
                    background: tileBg(t.seed, t.grad),
                    boxShadow: "0 30px 70px -26px rgba(0,0,0,.5)",
                    transition: anim
                      ? `transform .58s ${EASE}, border-radius .58s ${EASE}, opacity .34s ease`
                      : "none",
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
