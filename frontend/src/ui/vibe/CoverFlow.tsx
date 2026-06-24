// ============================================================
// CoverFlow — Apple-style 3D cover carousel (reflections, drag, keys)
// Realises the proposal's "Card Flow" middle layer:
//   · background follows the centered cover
//   · Down expands the center item's tracklist in place
//   · Enter opens the full detail
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { Icon, Art, artPair, artBg } from "./primitives";

type Props = {
  items: any[];
  center: number;
  setCenter: (n: number | ((c: number) => number)) => void;
  onOpen: (item: any) => void;
  onPlay: (item: any) => void;
  accent: string;
  tracksFor?: (item: any) => any[];
  onPlayTrack?: (track: any) => void;
};

export function CoverFlow({
  items,
  center,
  setCenter,
  onOpen,
  onPlay,
  accent,
  tracksFor,
  onPlayTrack,
}: Props) {
  const COVER = 280;
  // Only the center ±4 are ever visible (tf() sets op:0 beyond), so mount a
  // ±6 window (2-card margin → entering cards mount invisibly, then fade in as
  // they cross into ±4). Keyed on `center`, this is the carousel's analogue of
  // scroll virtualization: ~13 cards in the DOM instead of all N.
  const COVER_WINDOW = 6;
  // Progress dots are cheap but N of them overflow the bar and waste transitions
  // at scale; window them too. Small lists (≤ 2*win+1) still render every dot.
  const COVER_DOT_WINDOW = 20;
  const drag = useRef<any>(null);
  const [expanded, setExpanded] = useState(false);

  const clamp = (n: number) => Math.max(0, Math.min(items.length - 1, n));
  const cur = items[center];

  // refs capture latest values for the stable effect below
  const centerRef = useRef(center);
  const expandedRef = useRef(expanded);
  const itemsRef = useRef(items);
  const tracksForRef = useRef(tracksFor);
  const onOpenRef = useRef(onOpen);
  const setExpandedRef = useRef(setExpanded);
  const setCenterRef = useRef(setCenter);
  // sync refs every render so the stable event handler always reads latest values
  centerRef.current = center;
  expandedRef.current = expanded;
  itemsRef.current = items;
  tracksForRef.current = tracksFor;
  onOpenRef.current = onOpen;
  setExpandedRef.current = setExpanded;
  setCenterRef.current = setCenter;

  // background follows the centered cover
  useEffect(() => {
    if (cur && window.__AMBIENT) window.__AMBIENT(cur.seed, cur.grad);
    // Intentionally keyed on `center`: re-sync the ambient background when the
    // centered index changes. `cur`/`cur.grad` are derived and `items` is
    // recreated upstream each render, so depending on them would re-fire every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center]);

  useEffect(() => {
    setExpanded(false);
  }, [center]);

  const NP_EASE = "cubic-bezier(.16,1,.3,1)";
  const sheetTracks = expanded && tracksFor && cur ? tracksFor(cur) || [] : [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        setCenterRef.current((c: number) =>
          Math.max(0, Math.min(itemsRef.current.length - 1, c - 1)),
        );
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        setCenterRef.current((c: number) =>
          Math.max(0, Math.min(itemsRef.current.length - 1, c + 1)),
        );
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        if (tracksForRef.current) setExpandedRef.current(true);
      } else if (e.key === "ArrowUp") {
        if (expandedRef.current) {
          e.preventDefault();
          e.stopPropagation();
          setExpandedRef.current(false);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        onOpenRef.current(itemsRef.current[centerRef.current]);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      drag.current = (drag.current || 0) + e.deltaX;
      if (drag.current > 60) {
        setCenter((c) => clamp(c + 1));
        drag.current = 0;
      } else if (drag.current < -60) {
        setCenter((c) => clamp(c - 1));
        drag.current = 0;
      }
    }
  };
  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, start: center };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || typeof drag.current !== "object") return;
    const d = e.clientX - drag.current.x;
    setCenter(clamp(drag.current.start - Math.round(d / 120)));
  };
  const onUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    drag.current = null;
  };

  const tf = (off: number) => {
    const s = Math.sign(off),
      a = Math.abs(off);
    if (off === 0) return { x: 0, ry: 0, tz: 130, sc: 1, z: 300, op: 1 };
    return {
      x: s * (185 + (a - 1) * 64),
      ry: -s * 60,
      tz: -50 - a * 26,
      sc: 0.92,
      z: 250 - a,
      op: a > 4 ? 0 : 1,
    };
  };

  return (
    <div
      onWheel={onWheel}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        cursor: "grab",
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: COVER * 1.8,
          perspective: 1500,
          transform: expanded ? "translateY(-58px) scale(.92)" : "none",
          transition: `transform .5s ${NP_EASE}`,
        }}
      >
        <div
          style={{ position: "absolute", left: "50%", top: "44%", transformStyle: "preserve-3d" }}
        >
          {items.map((it, i) => {
            // Windowed: skip cards outside the visible fan (+margin) — see COVER_WINDOW.
            if (Math.abs(i - center) > COVER_WINDOW) return null;
            const o = tf(i - center);
            const isC = i === center;
            return (
              <div
                key={it.id}
                // 3D card surface (cover art + reflection), not valid <button>
                // content — role="button" + keyboard is the right pattern.
                // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                role="button"
                tabIndex={0}
                aria-label={it.name}
                onClick={() =>
                  isC ? (tracksFor ? setExpanded((e) => !e) : onOpen(it)) : setCenter(i)
                }
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  if (!isC) {
                    setCenter(i);
                  } else if (tracksFor) {
                    setExpanded((x) => !x);
                  } else {
                    onOpen(it);
                  }
                }}
                onDoubleClick={() => isC && onOpen(it)}
                onContextMenu={
                  isC && it.obj
                    ? (e) => window.__COLLMENU && window.__COLLMENU(e, it.obj)
                    : undefined
                }
                style={{
                  position: "absolute",
                  left: -COVER / 2,
                  top: -COVER / 2,
                  width: COVER,
                  height: COVER,
                  transform: `translateX(${o.x}px) translateZ(${o.tz}px) rotateY(${o.ry}deg) scale(${o.sc})`,
                  zIndex: o.z,
                  opacity: o.op,
                  transition: "transform .45s cubic-bezier(.2,.7,.2,1), opacity .45s",
                  cursor: "pointer",
                  pointerEvents: o.op ? "auto" : "none",
                }}
              >
                {/* cover */}
                <Art
                  seed={it.seed}
                  grad={it.grad}
                  image={it.image}
                  images={it.images}
                  className="grain"
                  style={{
                    width: COVER,
                    height: COVER,
                    boxShadow: isC
                      ? `0 30px 70px -10px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.08)`
                      : "0 20px 50px -16px rgba(0,0,0,.7)",
                  }}
                >
                  {isC && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(it);
                      }}
                      aria-label="Play"
                      style={{
                        position: "absolute",
                        right: 16,
                        bottom: 16,
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        border: 0,
                        cursor: "pointer",
                        background: accent,
                        color: "#06060a",
                        display: "grid",
                        placeItems: "center",
                        boxShadow: `0 10px 26px -6px ${accent}`,
                        zIndex: 5,
                      }}
                    >
                      <Icon.play size={20} />
                    </button>
                  )}
                </Art>
                {/* reflection — mirrored off a glossy floor: small gap below the
                    cover, blurred, and fading out quickly; the centred card
                    reflects a touch brighter than the angled side cards. */}
                <div
                  className="grain"
                  aria-hidden
                  style={{
                    width: COVER,
                    height: COVER,
                    marginTop: 3,
                    background: artBg(it.seed, it.grad),
                    transform: "scaleY(-1)",
                    transformOrigin: "top",
                    overflow: "hidden",
                    filter: "blur(2px)",
                    WebkitMaskImage:
                      "linear-gradient(to bottom, rgba(0,0,0,.6) 0%, rgba(0,0,0,.14) 30%, transparent 50%)",
                    maskImage:
                      "linear-gradient(to bottom, rgba(0,0,0,.6) 0%, rgba(0,0,0,.14) 30%, transparent 50%)",
                    opacity: isC ? 0.45 : 0.28,
                    transition: "opacity .45s",
                  }}
                >
                  {it.image && (
                    <img
                      src={it.image}
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
              </div>
            );
          })}
        </div>
      </div>

      {/* meta */}
      <div
        key={cur?.id}
        className="fade-in"
        style={{
          textAlign: "center",
          marginTop: expanded ? -COVER * 0.66 : -COVER * 0.42,
          zIndex: 400,
          position: "relative",
          transition: `margin-top .5s ${NP_EASE}`,
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 300,
            letterSpacing: ".01em",
            maxWidth: 560,
            margin: "0 auto",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            overflowWrap: "anywhere",
          }}
        >
          {cur?.name}
        </div>
        <div
          className="mlabel"
          style={{
            color: "var(--tx-3)",
            marginTop: 8,
            maxWidth: 460,
            marginLeft: "auto",
            marginRight: "auto",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {cur?.sub}
        </div>
      </div>

      {/* progress dots */}
      {!expanded && (
        <div
          style={{ display: "flex", justifyContent: "center", gap: 7, marginTop: 22, zIndex: 400 }}
        >
          {items.map((_, i) => {
            if (Math.abs(i - center) > COVER_DOT_WINDOW) return null;
            return (
              <button
                key={i}
                onClick={() => setCenter(i)}
                aria-label={"Go to " + (i + 1)}
                style={{
                  width: i === center ? 22 : 7,
                  height: 7,
                  borderRadius: 99,
                  border: 0,
                  cursor: "pointer",
                  background: i === center ? accent : "rgba(255,255,255,.25)",
                  transition: "all .3s",
                  padding: 0,
                }}
              />
            );
          })}
        </div>
      )}

      {/* tracklist sheet — expands in place below the center cover */}
      {tracksFor && (
        <div
          className="scroll"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "56%",
            zIndex: 500,
            transform: expanded ? "translateY(0)" : "translateY(102%)",
            transition: `transform .52s ${NP_EASE}`,
            background: `linear-gradient(180deg, ${artPair(cur?.seed, cur?.grad)[1]}22, rgba(8,8,11,.97) 22%)`,
            backdropFilter: "blur(34px)",
            WebkitBackdropFilter: "blur(34px)",
            borderTop: "1px solid rgba(255,255,255,.13)",
            boxShadow: expanded ? "0 -30px 80px rgba(0,0,0,.6)" : "none",
          }}
        >
          <div
            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="button"
            tabIndex={0}
            aria-label="Collapse"
            onClick={() => setExpanded(false)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setExpanded(false);
              }
            }}
            style={{
              display: "grid",
              placeItems: "center",
              padding: "12px 0 4px",
              cursor: "pointer",
            }}
          >
            <div
              style={{ width: 44, height: 4, borderRadius: 3, background: "rgba(255,255,255,.28)" }}
            ></div>
          </div>
          <div style={{ padding: "6px 40px 30px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                  flex: "1 1 auto",
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 21,
                    fontWeight: 200,
                    letterSpacing: ".03em",
                    minWidth: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {cur?.name}
                </span>
                <span
                  className="mlabel"
                  style={{ color: "rgba(255,255,255,.4)", flex: "0 0 auto", whiteSpace: "nowrap" }}
                >
                  {sheetTracks.length} tracks
                </span>
              </div>
              <button
                className="pill-accent"
                style={{
                  fontSize: 11,
                  padding: "9px 18px",
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                  flex: "0 0 auto",
                }}
                onClick={() => onOpen(cur)}
              >
                Open
              </button>
            </div>
            {sheetTracks.map((t, i) => (
              <div
                key={t.id + i}
                // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                role="button"
                tabIndex={0}
                aria-label={t.title}
                onClick={() => onPlayTrack && onPlayTrack(t)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (onPlayTrack) onPlayTrack(t);
                  }
                }}
                onContextMenu={(e) => window.__TRACKMENU && window.__TRACKMENU(e, t)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "9px 0",
                  cursor: "pointer",
                  borderBottom: "1px solid rgba(255,255,255,.06)",
                }}
              >
                <span
                  className="mlabel"
                  style={{
                    width: 18,
                    textAlign: "center",
                    color: "rgba(255,255,255,.32)",
                    fontSize: 11,
                    flex: "0 0 auto",
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 300,
                      color: "rgba(255,255,255,.45)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.artist}
                  </div>
                </div>
                <span
                  className="mlabel"
                  style={{ color: "rgba(255,255,255,.32)", fontSize: 10, flex: "0 0 auto" }}
                >
                  {t.duration}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
