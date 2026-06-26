// ============================================================
// Sheet — a bottom drawer built on Radix Dialog. Replaces the hand-rolled
// slide-up panels (NowPlaying "Up Next", CoverFlow tracklist) that could only
// be dismissed via their drag handle. Radix now provides Escape, click-outside
// (the dimmed overlay), scroll-lock and ARIA dialog semantics for free; the
// Motion slide is preserved (AnimatePresence keeps it mounted through the exit).
//
// Portal `container` keeps the sheet positioned WITHIN a screen (absolute), not
// the whole window — pass the screen root ref so geometry matches the old
// in-place panel. Autofocus is suppressed on purpose so opening doesn't yank
// focus off the carousel/cover (keyboard/axis-nav is handled by the screens).
// ============================================================
import * as Dialog from "@radix-ui/react-dialog";
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
          <Dialog.Portal forceMount container={container ?? undefined}>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className={cn("absolute inset-0", overlayClassName)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ background: "rgba(0,0,0,.32)" }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              aria-describedby={undefined}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                ref={contentRef}
                className={cn("scroll absolute inset-x-0 bottom-0", className)}
                style={style}
                initial={{ y: "102%" }}
                animate={{ y: 0 }}
                exit={{ y: "102%" }}
                transition={{ duration: durationSec, ease: EASE }}
              >
                <Dialog.Title className="sr-only">{label}</Dialog.Title>
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
