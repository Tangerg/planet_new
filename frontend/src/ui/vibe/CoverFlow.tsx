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
  const drag = useRef<any>(null);
  const [expanded, setExpanded] = useState(false);

  const clamp = (n: number) => Math.max(0, Math.min(items.length - 1, n));
  const cur = items[center];

  // background follows the centered cover
  useEffect(() => {
    if (cur && window.__AMBIENT) window.__AMBIENT(cur.seed, cur.grad);
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
        setCenter((c) => clamp(c - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        setCenter((c) => clamp(c + 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        if (tracksFor) setExpanded(true);
      } else if (e.key === "ArrowUp") {
        if (expanded) {
          e.preventDefault();
          e.stopPropagation();
          setExpanded(false);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        onOpen(items[center]);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

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
    drag.current = { x: e.clientX, start: center };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || typeof drag.current !== "object") return;
    const d = e.clientX - drag.current.x;
    setCenter(clamp(drag.current.start - Math.round(d / 120)));
  };
  const onUp = () => {
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
            const o = tf(i - center);
            const isC = i === center;
            return (
              <div
                key={it.id}
                onClick={() =>
                  isC ? (tracksFor ? setExpanded((e) => !e) : onOpen(it)) : setCenter(i)
                }
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
                {/* reflection */}
                <div
                  className="grain"
                  aria-hidden
                  style={{
                    width: COVER,
                    height: COVER,
                    background: artBg(it.seed, it.grad),
                    transform: "scaleY(-1)",
                    transformOrigin: "top",
                    overflow: "hidden",
                    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,.45), transparent 55%)",
                    maskImage: "linear-gradient(to bottom, rgba(0,0,0,.45), transparent 55%)",
                    opacity: 0.5,
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
        <div style={{ fontSize: 30, fontWeight: 300, letterSpacing: ".01em" }}>{cur?.name}</div>
        <div className="mlabel" style={{ color: "var(--tx-3)", marginTop: 8 }}>
          {cur?.sub}
        </div>
      </div>

      {/* progress dots */}
      {!expanded && (
        <div
          style={{ display: "flex", justifyContent: "center", gap: 7, marginTop: 22, zIndex: 400 }}
        >
          {items.map((_, i) => (
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
          ))}
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
            onClick={() => setExpanded(false)}
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
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontSize: 21, fontWeight: 200, letterSpacing: ".03em" }}>
                  {cur?.name}
                </span>
                <span className="mlabel" style={{ color: "rgba(255,255,255,.4)" }}>
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
                }}
                onClick={() => onOpen(cur)}
              >
                Open
              </button>
            </div>
            {sheetTracks.map((t, i) => (
              <div
                key={t.id + i}
                onClick={() => onPlayTrack && onPlayTrack(t)}
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
                  <div style={{ fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,.45)" }}>
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
