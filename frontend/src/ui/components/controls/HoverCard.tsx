import { PreviewCard } from "@base-ui/react/preview-card";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import type { PopupAlign, PopupSide } from "./popup";

export type HoverCardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  /** The element the card hangs off; it opens on hover / focus. */
  trigger: React.ReactElement;
  side?: PopupSide;
  align?: PopupAlign;
  sideOffset?: number;
  collisionPadding?: number;
  /** Popup surface class + inline style. */
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Hover-reveal card on Base UI PreviewCard — a floating dark-glass surface shown
 * on hover / focus (long-text reveal, volume slider). Encapsulates the Base UI
 * parts + the Motion enter/exit so consumers pass only a trigger, positioning,
 * and content (rather than wiring PreviewCard directly). Controlled `open` inside
 * `<AnimatePresence>` drives the exit animation; `keepMounted` on the Portal is
 * what keeps the surface in the DOM long enough for Motion to animate it out.
 */
export function HoverCard({
  open,
  onOpenChange,
  openDelay,
  closeDelay,
  trigger,
  side = "bottom",
  align = "start",
  sideOffset = 8,
  collisionPadding,
  className,
  style,
  children,
}: HoverCardProps) {
  return (
    <PreviewCard.Root open={open} onOpenChange={onOpenChange}>
      <PreviewCard.Trigger render={trigger} delay={openDelay} closeDelay={closeDelay} />
      <AnimatePresence>
        {open && (
          <PreviewCard.Portal keepMounted>
            <PreviewCard.Positioner
              side={side}
              align={align}
              sideOffset={sideOffset}
              collisionPadding={collisionPadding}
            >
              <PreviewCard.Popup
                className={className}
                style={style}
                render={
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                }
              >
                {children}
              </PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        )}
      </AnimatePresence>
    </PreviewCard.Root>
  );
}
