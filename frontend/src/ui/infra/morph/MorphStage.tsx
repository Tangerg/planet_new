import React from "react";
import type { RefObject } from "react";

import "./morph.css";
import { EXPO_OUT_CSS } from "@/styles/motion";
import { MorphFrozen } from "./context";
import { MORPH_LAYER_FADE_SEC, MORPH_SEC, layerStyle, type Transition } from "./useMorphTransition";

type MorphStageProps<V extends string> = {
  viewRef: RefObject<HTMLDivElement | null>;
  view: V;
  trans: Transition<V> | null;
  renderScreen: (v: V) => React.ReactNode;
  tileBg: (seed: number | undefined, grad: string[] | undefined) => string;
};

type ClipStyle = React.CSSProperties & {
  WebkitClipPath?: string;
};

function radiusPct(r: number | string, size: number): number {
  const n = typeof r === "number" ? r : parseFloat(r) || 0;
  if (typeof r === "string" && r.trim().endsWith("%")) return Math.min(50, n);
  return size > 0 ? Math.min(50, (n / size) * 100) : 0;
}

export function MorphStage<V extends string>({
  viewRef,
  view,
  trans,
  renderScreen,
  tileBg,
}: MorphStageProps<V>) {
  const fromKey = trans?.from;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fromScreen = React.useMemo(() => (fromKey ? renderScreen(fromKey) : null), [fromKey]);
  return (
    <div className="view" ref={viewRef}>
      {(() => {
        const fwd = trans && trans.dir === "fwd" && trans.point;
        const clipping = fwd && trans.hero !== true;
        const hideHero = fwd && trans.hero !== false && trans.phase !== "reveal";
        const st: ClipStyle = { height: "100%" };
        if (clipping) {
          const started = trans.phase !== "start";
          const cp = `circle(${started ? trans.clipR : 0}px at ${trans.point.x}px ${trans.point.y}px)`;
          st.clipPath = cp;
          st.WebkitClipPath = cp;
          st.transition = started ? `clip-path ${MORPH_SEC}s ${EXPO_OUT_CSS}` : "none";
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
            const fromStyle: ClipStyle = layerStyle(trans);
            const hideFromHero = trans.dir === "rev" && trans.hero === true;
            if (trans.dir === "rev" && trans.hero === false && trans.point) {
              const collapsed = trans.phase !== "start";
              const cp = `circle(${collapsed ? 0 : trans.clipR}px at ${trans.point.x}px ${trans.point.y}px)`;
              fromStyle.clipPath = cp;
              fromStyle.WebkitClipPath = cp;
              fromStyle.opacity = 1;
              fromStyle.transition = collapsed ? `clip-path ${MORPH_SEC}s ${EXPO_OUT_CSS}` : "none";
            }
            return (
              <div
                className={hideFromHero ? "t-layer t-from t-hide-hero" : "t-layer t-from"}
                style={fromStyle}
              >
                <MorphFrozen>{fromScreen}</MorphFrozen>
              </div>
            );
          })()}
          {trans.hero !== false &&
            (() => {
              const t = trans;
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
                      ? `transform ${MORPH_SEC}s ${EXPO_OUT_CSS}, border-radius ${MORPH_SEC}s ${EXPO_OUT_CSS}, opacity ${MORPH_LAYER_FADE_SEC}s ease`
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
