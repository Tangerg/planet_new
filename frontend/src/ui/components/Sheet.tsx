import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { cn } from "@/lib/cn";
import { EXPO_OUT } from "@/styles/motion";

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container?: HTMLElement | null;
  label: string;
  className?: string;
  style?: React.CSSProperties;
  overlayClassName?: string;
  contentRef?: React.Ref<HTMLDivElement>;
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
  durationSec = 0.38,
  children,
}: SheetProps) {
  const popupStyle: React.CSSProperties = {
    ...style,
    contain: "layout paint style",
    willChange: "transform",
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence initial={false}>
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
                  transition={{ duration: 0.2 }}
                  style={{ willChange: "opacity" }}
                />
              }
            />
            <Dialog.Popup
              className={cn("scroll absolute inset-x-0 bottom-0", className)}
              style={popupStyle}
              initialFocus={false}
              finalFocus={false}
              render={
                <motion.div
                  ref={contentRef}
                  initial={{ transform: "translateY(102%)" }}
                  animate={{ transform: "translateY(0%)" }}
                  exit={{ transform: "translateY(102%)" }}
                  transition={{ duration: durationSec, ease: EXPO_OUT }}
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
