// ============================================================
// XMB — XrossMediaBar launcher (PSP-style cross navigation)
// Horizontal categories × vertical items, keyboard + click driven.
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { Icon, artBg, artPair } from "./primitives";

const XMB_CAT_GAP = 172; // horizontal spacing between category icons
const XMB_ANCHOR = "26%"; // x of the active category column (icon + its sub-item list)
const XMB_BAR_Y = "40%"; // y of the horizontal category bar
const XMB_ROW = 58; // sub-item row height
const XMB_BELOW = 84; // selected sub-item sits this far below the bar
const XMB_ABOVE = 82; // nearest passed sub-item sits this far above the bar
const XMB_AFTER_ACTIVE = 30; // extra room below the active item for its underline + subtitle

function FlowWaves({ accent }: { accent: string }) {
  // a few drifting bezier strokes — the signature XMB "wave"
  const paths = [
    { d: "M-200 380 C 200 240, 520 520, 900 360 S 1500 220, 1800 420", w: 1.6, o: 0.4, dur: 28 },
    { d: "M-200 440 C 260 360, 560 600, 920 440 S 1520 320, 1800 500", w: 1.1, o: 0.24, dur: 36 },
    { d: "M-200 320 C 240 460, 600 200, 940 380 S 1480 540, 1800 340", w: 0.8, o: 0.15, dur: 46 },
  ];
  return (
    <svg
      viewBox="0 0 1280 736"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 2,
        pointerEvents: "none",
      }}
    >
      <defs>
        <linearGradient id="wv" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={accent} stopOpacity="0" />
          <stop offset=".5" stopColor={accent} stopOpacity="1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke="url(#wv)"
          strokeWidth={p.w}
          opacity={p.o}
          style={{ animation: `wvdrift ${p.dur}s ease-in-out ${i * -3}s infinite alternate` }}
        />
      ))}
      <style>{`@keyframes wvdrift{from{transform:translate(-30px,-8px)}to{transform:translate(30px,10px)}}`}</style>
    </svg>
  );
}

function XmbCategory({
  cat,
  active,
  dim,
  onClick,
}: {
  cat: any;
  active: boolean;
  dim: number;
  onClick: () => void;
}) {
  const I = Icon[cat.icon] || Icon.note;
  const sz = active ? 92 : 58;
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: "translate(-50%,-50%)",
        background: "none",
        border: 0,
        cursor: "pointer",
        padding: 0,
        display: "grid",
        placeItems: "center",
        width: sz,
        height: sz,
        transition: `opacity .55s ${XMB_EASE}, width .55s ${XMB_EASE}, height .55s ${XMB_EASE}`,
        opacity: active ? 1 : dim,
      }}
    >
      <span
        style={{
          width: sz,
          height: sz,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          color: active ? "#06060a" : "rgba(255,255,255,.85)",
          background: active ? "var(--accent)" : "rgba(16,16,22,.55)",
          border: active ? "none" : "1px solid rgba(255,255,255,.14)",
          backdropFilter: active ? "none" : "blur(6px)",
          boxShadow: active ? "0 0 44px -6px var(--accent), 0 8px 24px rgba(0,0,0,.45)" : "none",
          animation: active ? "xmbCatBreathe 3.4s ease-in-out infinite" : "none",
          transition: `all .55s ${XMB_EASE}`,
        }}
      >
        <I size={active ? 40 : 26} />
      </span>
    </button>
  );
}

const XMB_EASE = "cubic-bezier(.22,1,.28,1)"; // soft easeOut, gentle settle

function XmbItem({ item, active, o }: { item: any; active: boolean; o: number }) {
  // one vertical column: passed items rise above the bar, upcoming sink below
  const ad = Math.abs(o),
    above = o < 0;
  const op = active ? 1 : Math.max(0.14, (above ? 0.4 : 0.54) - 0.13 * ad);
  const blur = active ? 0 : Math.min(2.6, 0.55 * ad);
  const iconSz = active ? 52 : 30;
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: active ? 22 : 18,
        filter: `blur(${blur}px)`,
        opacity: op,
        transition: `opacity .55s ${XMB_EASE}, filter .55s ease`,
      }}
    >
      <div
        style={{
          width: 60,
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          data-art="1"
          data-xmb-active-art={active ? "1" : undefined}
          style={{
            width: iconSz,
            height: iconSz,
            borderRadius: active ? 12 : 8,
            background: artBg(item.seed, item.grad),
            boxShadow: active ? "0 12px 30px rgba(0,0,0,.5)" : "0 4px 12px rgba(0,0,0,.4)",
            animation: active ? "xmbArtBreathe 3.2s ease-in-out infinite" : "none",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            transition: `all .55s ${XMB_EASE}`,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {item.image && (
            <img
              src={item.image}
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
          {item.icon &&
            !item.image &&
            (Icon[item.icon]
              ? React.createElement(Icon[item.icon], { size: active ? 20 : 15, filled: true })
              : null)}
        </div>
      </div>
      <div style={{ minWidth: 0, position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: active ? 27 : 18,
            fontWeight: 300,
            letterSpacing: active ? ".02em" : ".005em",
            lineHeight: 1.1,
            color: active ? "#fff" : "rgba(255,255,255,.8)",
            transition: `all .55s ${XMB_EASE}`,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 340,
          }}
        >
          {item.label}
        </div>
        {active && (
          <div
            className="fade-in"
            style={{
              height: 2,
              width: 42,
              marginTop: 10,
              borderRadius: 2,
              background: "var(--accent)",
              boxShadow: "0 0 12px -1px var(--accent)",
            }}
          />
        )}
        {active && item.sub && (
          <div
            className="mlabel fade-in"
            style={{
              marginTop: 9,
              fontSize: 10.5,
              color: "rgba(255,255,255,.55)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 340,
            }}
          >
            {item.sub}
          </div>
        )}
      </div>
    </div>
  );
}

type Props = {
  cats: any[];
  accent: string;
  playing: boolean;
  showWaves?: boolean;
  onOpen?: (m: any, rect: DOMRect) => void;
  cState?: number;
  setCState?: (n: number) => void;
  rowsState?: Record<string, number>;
  setRowsState?: (r: any) => void;
};

export const XMB = React.memo(function XMB({
  cats,
  accent,
  playing: _playing,
  showWaves = true,
  onOpen,
  cState,
  setCState,
  rowsState,
  setRowsState,
}: Props) {
  const [cI, setCI] = useState(1); // active category (fallback)
  const [rowsI, setRowsI] = useState<Record<string, number>>({}); // remembered item index per category (fallback)
  const c = cState != null ? cState : cI;
  const setC = setCState || setCI;
  const rows = rowsState != null ? rowsState : rowsI;
  const setRows = setRowsState || setRowsI;
  const it = rows[c] || 0;
  const cat = cats[c];
  const item = cat.items[it];

  const setItem = (n: number) =>
    setRows((r: any) => ({ ...r, [c]: Math.max(0, Math.min(cat.items.length - 1, n)) }));
  const _glow = artPair(item.seed, item.grad)[1]; // stage-light colour from the active cover
  const move = (dc: number) => {
    const nc = Math.max(0, Math.min(cats.length - 1, c + dc));
    setC(nc);
  };

  const openItem = (m: any, e: any) => {
    const node = e.currentTarget.querySelector("[data-art]") || e.currentTarget;
    if (onOpen) onOpen(m, node.getBoundingClientRect());
    else if (m.run) m.run();
  };

  const wheelRef = useRef(0);
  // refs capture latest values for the stable effect below
  const cRef = useRef(c);
  const itRef = useRef(it);
  const itemRef = useRef(item);
  const catsRef = useRef(cats);
  const catRef = useRef(cat);
  const onOpenRef = useRef(onOpen);
  const moveRef = useRef(move);
  const setItemRef = useRef(setItem);
  // sync refs every render so the stable event handlers always read latest values
  cRef.current = c;
  itRef.current = it;
  itemRef.current = item;
  catsRef.current = cats;
  catRef.current = cat;
  onOpenRef.current = onOpen;
  moveRef.current = move;
  setItemRef.current = setItem;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveRef.current(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        moveRef.current(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setItemRef.current(itRef.current - 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setItemRef.current(itRef.current + 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (itemRef.current) {
          const node = document.querySelector("[data-xmb-active-art]");
          if (onOpenRef.current && node)
            onOpenRef.current(itemRef.current, node.getBoundingClientRect());
          else if (itemRef.current.run) itemRef.current.run();
        }
      }
    };
    // trackpad / wheel: horizontal swipe changes category, vertical changes item
    const onWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now < wheelRef.current) return;
      const ax = Math.abs(e.deltaX),
        ay = Math.abs(e.deltaY);
      if (Math.max(ax, ay) < 6) return;
      if (ax > ay + 2) moveRef.current(e.deltaX > 0 ? 1 : -1);
      else setItemRef.current(itRef.current + (e.deltaY > 0 ? 1 : -1));
      wheelRef.current = now + 250;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <div
      className="fade-in"
      style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#06060a" }}
    >
      <style>{`
        @keyframes xmbArtBreathe { 0%,100%{ box-shadow: 0 12px 30px rgba(0,0,0,.5), 0 0 26px -10px var(--accent);} 50%{ box-shadow: 0 14px 34px rgba(0,0,0,.55), 0 0 50px -6px var(--accent);} }
        @keyframes xmbCatBreathe { 0%,100%{ box-shadow: 0 0 44px -8px var(--accent), 0 8px 24px rgba(0,0,0,.45);} 50%{ box-shadow: 0 0 70px 2px var(--accent), 0 8px 24px rgba(0,0,0,.45);} }
      `}</style>
      {/* crossfading cover, blurred + scaled into an ambient field (stage backdrop) */}
      <div
        key={`${c}-${it}`}
        className="fade-in"
        style={{
          position: "absolute",
          inset: "-8%",
          zIndex: 0,
          background: artBg(item.seed, item.grad),
          filter: "blur(54px) saturate(1.35)",
          transform: "scale(1.18)",
          overflow: "hidden",
        }}
      >
        {item.image && (
          <img
            src={item.image}
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
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: "linear-gradient(180deg, rgba(6,6,10,.5), rgba(6,6,10,.66))",
        }}
      />
      {showWaves && <FlowWaves accent={accent} />}

      {/* sub-item column — single vertical list at the active category's x,
          passed items above the bar, upcoming below; the bar (icon+label) sits between */}
      <div
        style={{
          position: "absolute",
          left: `calc(${XMB_ANCHOR} - 30px)`,
          top: XMB_BAR_Y,
          zIndex: 6,
        }}
      >
        {cat.items.map((m: any, i: number) => {
          const o = i - it;
          const y =
            o >= 0
              ? XMB_BELOW + o * XMB_ROW + (o >= 1 ? XMB_AFTER_ACTIVE : 0)
              : -(XMB_ABOVE + (-o - 1) * XMB_ROW);
          // gentle bow: active item anchored, items above/below curve outward to the right
          const ad = Math.min(Math.abs(o), 3.4);
          const cx = Math.round(36 * Math.sin(ad * 0.46));
          return (
            <div
              key={m.key}
              onClick={(e) => (o === 0 ? openItem(m, e) : setItem(i))}
              // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- div is a visual layout container in XMB column
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (o === 0) openItem(m, e as any);
                  else setItem(i);
                }
              }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                cursor: "pointer",
                transform: `translate(${cx}px, ${y}px)`,
                transition: `transform .6s ${XMB_EASE}`,
              }}
            >
              <XmbItem item={m} active={o === 0} o={o} />
            </div>
          );
        })}
      </div>

      {/* category rail (horizontal axis) — active centered at the anchor, label beneath */}
      <div style={{ position: "absolute", left: XMB_ANCHOR, top: XMB_BAR_Y, zIndex: 9 }}>
        <div
          style={{
            transform: `translateX(${-c * XMB_CAT_GAP}px)`,
            transition: `transform .62s ${XMB_EASE}`,
          }}
        >
          {cats.map((cc: any, i: number) => {
            const d = Math.max(-7, Math.min(7, i - c));
            // smooth cosine arch: flat-tangent crest at the active, descends, tail lifts back up
            const cy = Math.round(36 * (1 - Math.cos(d * 0.62)));
            // bank each icon along the curve's tangent (active stays upright, slope 0 there)
            const slopeMag = 36 * 0.62 * Math.sin(d * 0.62);
            const rot =
              i === c
                ? 0
                : Math.max(
                    -10,
                    Math.min(10, Math.round(Math.atan2(slopeMag, XMB_CAT_GAP) * 57.3 * 0.95)),
                  );
            return (
              <div
                key={cc.id}
                style={{
                  position: "absolute",
                  left: i * XMB_CAT_GAP,
                  top: cy,
                  transform: `rotate(${rot}deg)`,
                  transition: `top .62s ${XMB_EASE}, transform .62s ${XMB_EASE}`,
                }}
              >
                <XmbCategory cat={cc} active={i === c} dim={0.3} onClick={() => setC(i)} />
              </div>
            );
          })}
        </div>
      </div>

      {/* category title — top-left, one line, with the same accent tick as section heads */}
      <div style={{ position: "absolute", left: 84, top: 84, zIndex: 8 }}>
        <div
          style={{
            fontSize: 54,
            fontWeight: 300,
            color: "#fff",
            letterSpacing: ".005em",
            lineHeight: 1,
            whiteSpace: "nowrap",
            textShadow: "0 2px 24px rgba(0,0,0,.45)",
          }}
        >
          {cat.label}
        </div>
      </div>

      {/* control hint — bottom-right, clear of the left-aligned item column */}
      <div
        style={{
          position: "absolute",
          right: 44,
          bottom: 22,
          zIndex: 8,
          display: "flex",
          justifyContent: "flex-end",
          gap: 26,
        }}
      >
        {[
          ["◀ ▶", "Category"],
          ["▲ ▼", "Browse"],
          ["↵", "Open"],
        ].map(([k, l]) => (
          <span key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)" }}>
              {k}
            </span>
            <span className="mlabel" style={{ color: "rgba(255,255,255,.45)", fontSize: 10 }}>
              {l}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
});
