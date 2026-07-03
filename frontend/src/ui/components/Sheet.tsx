// ============================================================
// Sheet — a bottom drawer built on Base UI Dialog. Replaces the hand-rolled
// slide-up panels (NowPlaying "Up Next", CoverFlow tracklist) that could only
// be dismissed via their drag handle. Base UI provides Escape, click-outside
// (the dimmed backdrop), scroll-lock and ARIA dialog semantics for free; the
// Motion slide is preserved (AnimatePresence keeps it mounted through the exit).
//
// Portal `container` keeps the sheet positioned WITHIN a screen (absolute), not
// the whole window — pass the screen root ref so geometry matches the old
// in-place panel. `initialFocus`/`finalFocus={false}` suppress autofocus on
// purpose so opening doesn't yank focus off the carousel/cover (keyboard/axis-nav
// is handled by the screens).
// ============================================================
import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { cn } from "@/lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Portal target — the screen root, so the sheet stays absolutely positioned
   *  within that screen (not the whole window). Falls back to <body> if null. */
  container?: HTMLElement | null;
  /** Accessible dialog name (visually hidden). */
  label: string;
  /** Content box layout (height, z-index, …). */
  className?: string;
  /** Dynamic content styling (gradient bg, backdrop-filter, border, shadow). */
  style?: React.CSSProperties;
  /** Overlay layout (z-index sits just under the content). */
  overlayClassName?: string;
  /** Forwarded to the scrolling content box (for a windowed list inside). */
  contentRef?: React.Ref<HTMLDivElement>;
  /** Slide duration in seconds (defaults to 0.56). */
  durationSec?: number;
  children: React.ReactNode;
};

export function Sheet({
  open,
  onOpenChange,
  container,
  label,
  className,
  style,
  overlayClassName,
  contentRef,
  durationSec = 0.56,
  children,
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal keepMounted container={container ?? undefined}>
            <Dialog.Backdrop
              className={cn("absolute inset-0", overlayClassName)}
              style={{ background: "rgba(0,0,0,.32)" }}
              render={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              }
            />
            <Dialog.Popup
              className={cn("scroll absolute inset-x-0 bottom-0", className)}
              style={style}
              initialFocus={false}
              finalFocus={false}
              render={
                // Animate the `transform` property (not Motion's `y` shorthand):
                // Base UI keeps the popup mounted through the exit only while it
                // detects a WAAPI animation via getAnimations(), which Motion runs
                // for `transform`/`opacity` but not for the JS-driven `y`.
                <motion.div
                  ref={contentRef}
                  initial={{ transform: "translateY(102%)" }}
                  animate={{ transform: "translateY(0%)" }}
                  exit={{ transform: "translateY(102%)" }}
                  transition={{ duration: durationSec, ease: EASE }}
                />
              }
            >
              <Dialog.Title className="sr-only">{label}</Dialog.Title>
              {children}
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
