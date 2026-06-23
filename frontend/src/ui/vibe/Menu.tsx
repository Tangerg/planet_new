import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Icon } from "./primitives";

// ============================================================
// ContextMenu — right-click menu, edge-aware, native-feeling
// ============================================================
type Props = {
  x: number;
  y: number;
  items: any[];
  onClose: () => void;
  accent: string;
};

export function ContextMenu({ x, y, items, onClose, accent }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ left: x, top: y, ready: false });

  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 10;
    let left = x, top = y;
    if (left + r.width + pad > window.innerWidth)  left = window.innerWidth - r.width - pad;
    if (top + r.height + pad > window.innerHeight) top = window.innerHeight - r.height - pad;
    setPos({ left: Math.max(pad, left), top: Math.max(pad, top), ready: true });
  }, [x, y]);

  useEffect(() => {
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", close);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", close);
      window.removeEventListener("resize", close);
    };
  }, []);

  return (
    <div ref={ref} className="ctxmenu" onMouseDown={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}
      style={{ position: "fixed", left: pos.left, top: pos.top, zIndex: 9000, minWidth: 212,
        opacity: pos.ready ? 1 : 0, transform: pos.ready ? "none" : "scale(.96)", transformOrigin: "top left",
        transition: "opacity .12s ease, transform .14s cubic-bezier(.32,.72,0,1)" }}>
      {items.map((it, i) => it.sep ? (
        <div key={i} className="ctxsep"></div>
      ) : (
        <button key={i} className="ctxitem" onClick={() => { onClose(); it.onClick && it.onClick(); }}>
          {it.icon && (
            <span className="ctxico" style={{ color: it.danger ? "#ff6b6b" : (it.accent ? accent : "rgba(255,255,255,.66)") }}>
              {React.createElement(Icon[it.icon], { size: 16 })}
            </span>
          )}
          <span className="ctxlabel" style={{ color: it.danger ? "#ff6b6b" : "#fff" }}>{it.label}</span>
          {it.hint && <span className="ctxhint">{it.hint}</span>}
        </button>
      ))}
    </div>
  );
}
