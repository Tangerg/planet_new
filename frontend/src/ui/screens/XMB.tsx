// ============================================================
// XMB — XrossMediaBar launcher (PSP-style cross navigation)
// Horizontal categories × vertical items, keyboard + click driven.
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { Icon, artBg, artPair, HeroBackdrop } from "@/components/primitives";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/controls/Button";
import { activateOnKey } from "@/lib/keys";

/** One XMB sub-item (a launcher tile under a category). */
export type XmbItemModel = {
  key: string;
  label: string;
  sub?: string;
  icon?: string;
  seed: number;
  grad?: string[];
  image?: string;
  dest: string;
  run?: () => void;
};

/** One XMB category column: an icon + a vertical list of items. */
export type XmbCat = {
  id: string;
  icon: string;
  label: string;
  items: XmbItemModel[];
};

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
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
    >
      <defs>
        <linearGradient id="wv" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={accent} stopOpacity="0" />
          <stop offset=".5" stopColor={accent} stopOpacity="1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {paths.map((p, i) => (
        <motion.path
          key={i}
          d={p.d}
          fill="none"
          stroke="url(#wv)"
          strokeWidth={p.w}
          opacity={p.o}
          animate={{ x: [-30, 30], y: [-8, 10] }}
          transition={{
            duration: p.dur,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />
      ))}
    </svg>
  );
}

function XmbCategory({
  cat,
  active,
  dim,
  onClick,
}: {
  cat: XmbCat;
  active: boolean;
  dim: number;
  onClick: () => void;
}) {
  const I = Icon[cat.icon] || Icon.note;
  const sz = active ? 92 : 58;
  // Breathing glow on the active icon. Motion can't interpolate a box-shadow
  // whose colour is `var(--accent)`, so drive a 0→1→0 value and template the
  // shadow from it — only the numbers tween, the accent var stays literal.
  const glow = useMotionValue(0);
  useEffect(() => {
    if (!active) return;
    const controls = animate(glow, [0, 1, 0], {
      duration: 3.4,
      ease: "easeInOut",
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [active, glow]);
  const catShadow = useTransform(
    glow,
    (v) =>
      `0 0 ${(44 + v * 26).toFixed(1)}px ${(-8 + v * 10).toFixed(1)}px var(--accent), 0 8px 24px rgba(0,0,0,.45)`,
  );
  return (
    <Button
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
      <motion.span
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
          boxShadow: active ? catShadow : "none",
          // box-shadow is Motion-driven (catShadow); transition the rest only, or
          // the CSS transition would fight the per-frame shadow updates.
          // backdrop-filter is deliberately NOT animated: tweening blur re-samples
          // and re-blurs the area behind every icon each frame (no GPU path) — the
          // frost just toggles, masked by the animated background/colour swap.
          transition: `width .55s ${XMB_EASE}, height .55s ${XMB_EASE}, color .55s ${XMB_EASE}, background .55s ${XMB_EASE}, border .55s ${XMB_EASE}`,
        }}
      >
        <I size={active ? 40 : 26} />
      </motion.span>
    </Button>
  );
}

const XMB_EASE = "cubic-bezier(.22,1,.28,1)"; // soft easeOut, gentle settle
const XMB_EASE_ARR = [0.22, 1, 0.28, 1] as const; // same curve for Motion (array form)

function XmbItem({ item, active, o }: { item: XmbItemModel; active: boolean; o: number }) {
  // one vertical column: passed items rise above the bar, upcoming sink below
  const ad = Math.abs(o),
    above = o < 0;
  const op = active ? 1 : Math.max(0.14, (above ? 0.4 : 0.54) - 0.13 * ad);
  const blur = active ? 0 : Math.min(2.6, 0.55 * ad);
  const iconSz = active ? 52 : 30;
  // Breathing glow on the active art — same accent-var box-shadow trick as
  // XmbCategory (template a 0→1→0 value so only the numbers tween).
  const glow = useMotionValue(0);
  useEffect(() => {
    if (!active) return;
    const controls = animate(glow, [0, 1, 0], {
      duration: 3.2,
      ease: "easeInOut",
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [active, glow]);
  const artShadow = useTransform(
    glow,
    (v) =>
      `0 ${(12 + v * 2).toFixed(1)}px ${(30 + v * 4).toFixed(1)}px rgba(0,0,0,${(0.5 + v * 0.05).toFixed(3)}), 0 0 ${(26 + v * 24).toFixed(1)}px ${(-10 + v * 4).toFixed(1)}px var(--accent)`,
  );
  return (
    <div
      className="relative flex items-center"
      style={{
        gap: active ? 22 : 18,
        filter: `blur(${blur}px)`,
        opacity: op,
        transition: `opacity .55s ${XMB_EASE}, filter .55s ease`,
      }}
    >
      <div className="relative z-[1] grid w-[60px] flex-none place-items-center">
        <motion.div
          data-art="1"
          data-xmb-active-art={active ? "1" : undefined}
          style={{
            width: iconSz,
            height: iconSz,
            borderRadius: active ? 12 : 8,
            background: artBg(item.seed, item.grad),
            boxShadow: active ? artShadow : "0 4px 12px rgba(0,0,0,.4)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            // box-shadow is Motion-driven (artShadow); transition the morphing
            // box props only so the CSS transition doesn't fight per-frame writes.
            transition: `width .55s ${XMB_EASE}, height .55s ${XMB_EASE}, border-radius .55s ${XMB_EASE}`,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {item.image && (
            <img
              src={item.image}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {item.icon &&
            !item.image &&
            (Icon[item.icon]
              ? React.createElement(Icon[item.icon], { size: active ? 20 : 15, filled: true })
              : null)}
        </motion.div>
      </div>
      <div className="relative z-[1] min-w-0">
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
            // The selected item is the focus and owns the whole bar's width, so
            // give it a far larger cap: at 27px a shared 340px cap truncated it
            // EARLIER than the 18px candidates, hiding text on selection. Widen
            // it so selecting reveals more of the title, never less.
            maxWidth: active ? 600 : 340,
          }}
        >
          {item.label}
        </div>
        {active && (
          <FadeIn
            className="mt-2.5 h-0.5 w-[42px] rounded-[2px] bg-accent"
            style={{ boxShadow: "0 0 12px -1px var(--accent)" }}
          />
        )}
        {active && item.sub && (
          <FadeIn className="mlabel mt-[9px] max-w-[600px] truncate text-[10.5px] text-white/[0.55]">
            {item.sub}
          </FadeIn>
        )}
      </div>
    </div>
  );
}

type Props = {
  cats: XmbCat[];
  accent: string;
  playing: boolean;
  /** Now-playing cover — drives the ambient backdrop. Absent = nothing playing. */
  np?: { image?: string; seed?: number; grad?: string[] };
  showWaves?: boolean;
  onOpen?: (m: XmbItemModel, rect: DOMRect) => void;
  cState?: number;
  setCState?: (n: number) => void;
  rowsState?: Record<string, number>;
  setRowsState?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

export const XMB = React.memo(function XMB({
  cats,
  accent,
  playing: _playing,
  np,
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
    setRows((r) => ({ ...r, [c]: Math.max(0, Math.min(cat.items.length - 1, n)) }));
  const _glow = artPair(item.seed, item.grad)[1]; // stage-light colour from the active cover
  const move = (dc: number) => {
    const nc = Math.max(0, Math.min(cats.length - 1, c + dc));
    setC(nc);
  };

  const openItem = (m: XmbItemModel, e: React.SyntheticEvent) => {
    const node = (e.currentTarget as Element).querySelector("[data-art]") || e.currentTarget;
    if (onOpen) onOpen(m, (node as Element).getBoundingClientRect());
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
    <FadeIn className="absolute inset-0 overflow-hidden bg-[#06060a]">
      {/* Ambient stage backdrop driven by the NOW-PLAYING cover (not the selected
          item), so it no longer thrashes colour on every nav — it only shifts when
          the song changes. Same living drift as the detail pages. Nothing playing
          → a deep, calm black (no seeded colour cycling). */}
      {np ? (
        <HeroBackdrop
          image={np.image}
          seed={np.seed}
          grad={np.grad}
          scrim="linear-gradient(180deg, rgba(6,6,10,.5) 0%, rgba(6,6,10,.66) 100%)"
        />
      ) : (
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(120% 120% at 50% 36%, #0c0d13 0%, #07070b 58%, #050507 100%)",
          }}
        />
      )}
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
        {cat.items.map((m, i) => {
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
              onKeyDown={activateOnKey((e) => {
                if (o === 0) openItem(m, e as any);
                else setItem(i);
              })}
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
          {cats.map((cc, i) => {
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
              // y + rotate via Motion (compositor) instead of animating `top`
              // (layout) — same arc, no per-frame reflow of the category row.
              <motion.div
                key={cc.id}
                style={{ position: "absolute", left: i * XMB_CAT_GAP, top: 0 }}
                initial={false}
                animate={{ y: cy, rotate: rot }}
                transition={{ duration: 0.62, ease: XMB_EASE_ARR }}
              >
                <XmbCategory cat={cc} active={i === c} dim={0.3} onClick={() => setC(i)} />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* category title — top-left, one line, with the same accent tick as section heads */}
      <div className="absolute left-[84px] top-[84px] z-[8]">
        <div
          className="whitespace-nowrap text-[54px] font-light leading-none tracking-[0.005em] text-white"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,.45)" }}
        >
          {cat.label}
        </div>
      </div>

      {/* control hint — bottom-right, clear of the left-aligned item column */}
      <div className="absolute bottom-[22px] right-11 z-[8] flex justify-end gap-[26px]">
        {[
          ["◀ ▶", "Category"],
          ["▲ ▼", "Browse"],
          ["↵", "Open"],
        ].map(([k, l]) => (
          <span key={l} className="flex items-center gap-2">
            <span className="font-mono text-[12px] text-accent">{k}</span>
            <span className="mlabel text-[10px] text-white/45">{l}</span>
          </span>
        ))}
      </div>
    </FadeIn>
  );
});
