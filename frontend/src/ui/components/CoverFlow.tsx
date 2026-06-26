// ============================================================
// CoverFlow — Apple-style 3D cover carousel (reflections, drag, keys)
// Realises the proposal's "Card Flow" middle layer:
//   · background follows the centered cover
//   · Down expands the center item's tracklist in place
//   · Enter opens the full detail
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import type { VibeTrack } from "@/model/adapt";
import type { FlowItem } from "@/model/derive";
import { Icon, Art, artPair, artBg } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { Sheet } from "@/components/Sheet";
import { TextReveal } from "@/components/controls/TextReveal";
import { FadeIn } from "@/components/motion";
import { useScreenActions } from "@/hooks/screenActions";

type Props = {
  items: FlowItem[];
  center: number;
  setCenter: (n: number | ((c: number) => number)) => void;
  onOpen: (item: FlowItem) => void;
  onPlay: (item: FlowItem) => void;
  accent: string;
  tracksFor?: (item: FlowItem) => VibeTrack[];
  onPlayTrack?: (track: VibeTrack) => void;
  /** Render covers as circles (artists) instead of squares (everything else). */
  round?: boolean;
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
  round,
}: Props) {
  const { trackMenu, collMenu } = useScreenActions();
  const COVER = 280;
  // Only the center ±4 are ever visible (tf() sets op:0 beyond) — 9 cards in a
  // gentle fan — so mount a ±6 window (2-card margin → entering cards mount
  // invisibly, then fade in as they cross into ±4). Keyed on `center`, this is
  // the carousel's analogue of scroll virtualization: ~13 cards, not all N.
  const COVER_WINDOW = 6;
  // Progress dots are cheap but N of them overflow the bar and waste transitions
  // at scale; window them too. Small lists (≤ 2*win+1) still render every dot.
  const COVER_DOT_WINDOW = 20;
  const drag = useRef<any>(null);
  // Portal target for the tracklist Sheet — keeps it positioned within the carousel.
  const rootRef = useRef<HTMLDivElement>(null);
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

  // The page background is NOT repainted per centered cover: rapidly recolouring
  // the whole backdrop on every flip is distracting and a photosensitivity risk.
  // The screen's own hero gradient (Detail/Library) stays put instead.
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
    // Gentle tilt (37°) + wide spacing so side cards read as cards, not edge-on
    // slivers; ±4 stay visible (9 total).
    return {
      x: s * (215 + (a - 1) * 84),
      ry: -s * 39,
      tz: -40 - a * 28,
      sc: 0.94,
      z: 250 - a,
      op: a > 4 ? 0 : 1,
    };
  };

  return (
    <div
      ref={rootRef}
      onWheel={onWheel}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      className="relative flex h-full cursor-grab select-none flex-col items-center justify-center overflow-hidden"
    >
      <motion.div
        // preserve-3d here too: this element carries the scene `perspective` AND
        // is itself transformed by Motion (y/scale). Without preserve-3d that
        // transform FLATTENS the descendants, so the cards' rotateY tilt collapses
        // to a flat row. initial={false} so it doesn't animate on first mount.
        style={{
          position: "relative",
          width: "100%",
          height: COVER * 1.8,
          perspective: 1500,
          transformStyle: "preserve-3d",
        }}
        initial={false}
        animate={{ y: expanded ? -58 : 0, scale: expanded ? 0.92 : 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
              <motion.div
                key={it.id}
                // 3D card surface (cover art + reflection), not valid a native button
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
                onContextMenu={isC && it.obj ? (e) => collMenu(e, it.obj) : undefined}
                // The fan geometry (per-card translate/rotateY/scale/opacity) is
                // Motion now — it tweens to the new values as `center` changes.
                // initial={false}: cards entering the windowed range snap to their
                // fanned position instead of flying in from zero (the stutter).
                initial={false}
                animate={{ x: o.x, z: o.tz, rotateY: o.ry, scale: o.sc, opacity: o.op }}
                transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
                style={{
                  position: "absolute",
                  left: -COVER / 2,
                  top: -COVER / 2,
                  width: COVER,
                  height: COVER,
                  zIndex: o.z,
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
                    borderRadius: round ? "50%" : undefined,
                    boxShadow: isC
                      ? `0 30px 70px -10px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.08)`
                      : "0 20px 50px -16px rgba(0,0,0,.7)",
                  }}
                >
                  {isC && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(it);
                      }}
                      aria-label="Play"
                      className="absolute z-[5] grid h-[52px] w-[52px] place-items-center rounded-full"
                      style={{
                        // On a circle the square corner sits outside the disc, so
                        // pull the button inward to rest on the lower-right edge.
                        right: round ? 30 : 16,
                        bottom: round ? 30 : 16,
                        background: accent,
                        color: "#06060a",
                        boxShadow: `0 10px 26px -6px ${accent}`,
                      }}
                    >
                      <Icon.play size={20} />
                    </Button>
                  )}
                </Art>
                {/* reflection — classic Cover Flow mirror on the floor below the
                    cover. scaleY(-1) about CENTER keeps the mirror below (origin
                    "top" would flip it up over the cover, hiding it); since the
                    flip also mirrors the mask, the gradient is `to top` so the
                    edge touching the cover stays brightest and fades downward. */}
                <div
                  className="grain"
                  aria-hidden
                  style={{
                    width: COVER,
                    height: COVER,
                    marginTop: 2,
                    borderRadius: round ? "50%" : undefined,
                    background: artBg(it.seed, it.grad),
                    transform: "scaleY(-1)",
                    transformOrigin: "center",
                    overflow: "hidden",
                    WebkitMaskImage:
                      "linear-gradient(to top, rgba(0,0,0,.62) 0%, rgba(0,0,0,.14) 30%, transparent 55%)",
                    maskImage:
                      "linear-gradient(to top, rgba(0,0,0,.62) 0%, rgba(0,0,0,.14) 30%, transparent 55%)",
                    opacity: isC ? 0.5 : 0.32,
                    transition: "opacity .45s",
                  }}
                >
                  {it.image && (
                    <img
                      src={it.image}
                      alt=""
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* meta */}
      <FadeIn
        key={cur?.id}
        className="relative z-[400] text-center"
        style={{
          marginTop: expanded ? -COVER * 0.66 : -COVER * 0.42,
          transition: `margin-top .5s ${NP_EASE}`,
        }}
      >
        <TextReveal
          lines={1}
          side="top"
          align="center"
          full={cur?.name}
          style={{
            fontSize: 30,
            fontWeight: 300,
            letterSpacing: ".01em",
            maxWidth: 560,
            margin: "0 auto",
            // One line, never wraps to two (which crammed the meta against the
            // cover); the full title reveals on hover and in the expanded sheet.
          }}
        >
          {cur?.name}
        </TextReveal>
        <TextReveal
          lines={1}
          side="top"
          align="center"
          className="mlabel"
          full={cur?.sub}
          style={{
            color: "var(--tx-3)",
            marginTop: 8,
            maxWidth: 460,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {cur?.sub}
        </TextReveal>
      </FadeIn>

      {/* progress dots */}
      {!expanded && (
        <div className="z-[400] mt-[22px] flex justify-center gap-[7px]">
          {items.map((_, i) => {
            if (Math.abs(i - center) > COVER_DOT_WINDOW) return null;
            return (
              <Button
                key={i}
                onClick={() => setCenter(i)}
                aria-label={"Go to " + (i + 1)}
                className="h-[7px] rounded-full p-0 transition-all duration-300"
                style={{
                  width: i === center ? 22 : 7,
                  background: i === center ? accent : "rgba(255,255,255,.25)",
                }}
              />
            );
          })}
        </div>
      )}

      {/* tracklist sheet — Radix Dialog (Escape / click-outside), Motion slide */}
      {tracksFor && (
        <Sheet
          open={expanded}
          onOpenChange={setExpanded}
          container={rootRef.current}
          label="Tracklist"
          className="z-[500] h-[56%]"
          overlayClassName="z-[499]"
          durationSec={0.52}
          style={{
            background: `linear-gradient(180deg, ${artPair(cur?.seed, cur?.grad)[1]}22, rgba(8,8,11,.97) 22%)`,
            backdropFilter: "blur(34px)",
            WebkitBackdropFilter: "blur(34px)",
            borderTop: "1px solid rgba(255,255,255,.13)",
            boxShadow: "0 -30px 80px rgba(0,0,0,.6)",
          }}
        >
          <button
            type="button"
            aria-label="Collapse"
            onClick={() => setExpanded(false)}
            className="btn grid w-full cursor-pointer place-items-center pb-1 pt-3"
          >
            <div className="h-1 w-11 rounded-sm bg-white/[0.28]"></div>
          </button>
          <div className="px-10 pb-[30px] pt-1.5">
            <div className="mb-3 flex items-center justify-between gap-[14px]">
              <div className="flex min-w-0 flex-auto items-baseline gap-3">
                <span className="truncate text-[21px] font-extralight tracking-[0.03em]">
                  {cur?.name}
                </span>
                <span className="mlabel flex-none whitespace-nowrap text-white/40">
                  {sheetTracks.length} tracks
                </span>
              </div>
              <Button
                className="pill-accent inline-flex flex-none items-center gap-2"
                style={{ fontSize: 11, padding: "9px 18px" }}
                onClick={() => onOpen(cur)}
              >
                Open
              </Button>
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
                onContextMenu={(e) => trackMenu(e, t)}
                className="flex cursor-pointer items-center gap-[14px] border-b border-white/[0.06] py-[9px]"
              >
                <span className="mlabel w-[18px] flex-none text-center text-[11px] text-white/[0.32]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px]">{t.title}</div>
                  <div className="truncate text-[12px] font-light text-white/45">{t.artist}</div>
                </div>
                <span className="mlabel flex-none text-[10px] text-white/[0.32]">{t.duration}</span>
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
