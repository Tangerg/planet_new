// ============================================================
// CoverFlow — Apple-style 3D cover carousel (reflections, drag, keys)
// Realises the proposal's "Card Flow" middle layer:
//   · background follows the centered cover
//   · Down expands the center item's tracklist in place
//   · Enter opens the full detail
//
// This is the assembler: it owns the expand state and composes the fanned cards
// (CoverCard + coverTransform geometry), the meta caption, the progress dots, and
// the expanded tracklist Sheet. Keyboard / wheel / drag driving is useCoverFlowInput.
// ============================================================
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import type { VibeCollection, VibeTrack } from "@/model/vibe";
import type { FlowItem } from "@/model/derive";
import { Button } from "@/components/controls/Button";
import { TextReveal } from "@/components/controls/TextReveal";
import { FadeIn } from "@/components/motion";
import { CoverCard } from "@/components/coverflow/CoverCard";
import { CoverFlowSheet } from "@/components/coverflow/CoverFlowSheet";
import {
  COVER,
  COVER_DOT_WINDOW,
  COVER_WINDOW,
  META_EASE,
  SCENE_EASE,
  coverTransform,
} from "@/components/coverflow/geometry";
import { useScreenActions } from "@/hooks/screenActions";
import { useCoverFlowInput } from "@/components/coverflow/useCoverFlowInput";

type Props<T extends VibeTrack | VibeCollection> = {
  items: FlowItem<T>[];
  center: number;
  setCenter: (n: number | ((c: number) => number)) => void;
  /** Receives the source object (track or collection), not the flow wrapper. */
  onOpen: (item: T) => void;
  onPlay: (item: T) => void;
  canPlay?: (item: T) => boolean;
  accent: string;
  tracksFor?: (item: T) => VibeTrack[];
  onPlayTrack?: (track: VibeTrack) => void;
  /** Render covers as circles (artists) instead of squares (everything else). */
  round?: boolean;
};

export function CoverFlow<T extends VibeTrack | VibeCollection>({
  items,
  center,
  setCenter,
  onOpen,
  onPlay,
  canPlay,
  accent,
  tracksFor,
  onPlayTrack,
  round,
}: Props<T>) {
  const { t } = useTranslation();
  const { trackMenu, collMenu } = useScreenActions();
  // Portal target for the tracklist Sheet — keeps it positioned within the carousel.
  const rootRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  const cur = items[center];
  // Artists (round) are people, not playable collections: no in-place tracklist
  // and no play fab — clicking a cover just opens the artist. So the expand
  // behaviour is gated off for round covers (clicks fall through to onOpen).
  const expandable = round ? undefined : tracksFor;

  // The page background is NOT repainted per centered cover: rapidly recolouring
  // the whole backdrop on every flip is distracting and a photosensitivity risk.
  // The screen's own hero gradient (Detail/Library) stays put instead.
  useEffect(() => {
    setExpanded(false);
  }, [center]);

  const sheetTracks = expanded && expandable && cur ? expandable(cur.obj) || [] : [];

  const input = useCoverFlowInput({
    items,
    center,
    expanded,
    expandable,
    onOpen,
    setCenter,
    setExpanded,
  });

  return (
    <div
      ref={rootRef}
      onWheel={input.onWheel}
      onPointerDown={input.onPointerDown}
      onPointerMove={input.onPointerMove}
      onPointerUp={input.onPointerUp}
      onPointerLeave={input.onPointerUp}
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
        transition={{ duration: 0.34, ease: SCENE_EASE }}
      >
        <div
          style={{ position: "absolute", left: "50%", top: "44%", transformStyle: "preserve-3d" }}
        >
          {items.map((it, i) => {
            // Windowed: skip cards outside the visible fan (+margin) — see COVER_WINDOW.
            if (Math.abs(i - center) > COVER_WINDOW) return null;
            const isC = i === center;
            return (
              <CoverCard
                key={it.id}
                item={it}
                isCenter={isC}
                cover={COVER}
                round={round}
                accent={accent}
                showPlay={isC && !round && (canPlay?.(it.obj) ?? true)}
                transform={coverTransform(i - center)}
                onActivate={() =>
                  isC ? (expandable ? setExpanded((e) => !e) : onOpen(it.obj)) : setCenter(i)
                }
                onDoubleOpen={isC ? () => onOpen(it.obj) : undefined}
                onContextMenu={isC && it.obj ? (e) => collMenu(e, it.obj) : undefined}
                onPlay={() => onPlay(it.obj)}
              />
            );
          })}
        </div>
      </motion.div>

      {/* meta — NOT keyed on cur.id: re-mounting per step re-ran each TextReveal's
          layout measure + HoverCard + the FadeIn on every flip, which stalled the
          main thread (the "lag" on fast switching). Content updates in place. */}
      <FadeIn className="relative z-[400]" style={{ marginTop: -COVER * 0.42 }}>
        <div
          className="text-center"
          style={{
            // Composited: animate the expand delta on the GPU (translateY) rather
            // than reflowing margin-top. A plain div (not the motion FadeIn) so
            // Motion's own transform management can't clobber the CSS transition.
            transform: `translateY(${expanded ? -COVER * 0.24 : 0}px)`,
            transition: `transform .34s ${META_EASE}`,
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
        </div>
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
                aria-label={t("a11y.goToSlide", { index: i + 1 })}
                className="h-[7px] rounded-full p-0 transition-[width,background-color] duration-300"
                style={{
                  width: i === center ? 22 : 7,
                  background: i === center ? accent : "rgba(255,255,255,.25)",
                }}
              />
            );
          })}
        </div>
      )}

      {/* tracklist sheet — Base UI Dialog (Escape / click-outside), Motion slide */}
      {tracksFor && (
        <CoverFlowSheet
          open={expanded}
          onOpenChange={setExpanded}
          container={rootRef.current}
          item={cur}
          tracks={sheetTracks}
          onOpen={() => cur && onOpen(cur.obj)}
          onPlayTrack={onPlayTrack}
          trackMenu={trackMenu}
        />
      )}
    </div>
  );
}
