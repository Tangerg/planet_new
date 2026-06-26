import * as HoverCard from "@radix-ui/react-hover-card";
import { AnimatePresence, motion } from "motion/react";
import React, { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

type Props = {
  /** The text to show — clamped in place, revealed in full on hover when it overflows. */
  children: React.ReactNode;
  /** Lines to clamp to; 1 = single-line ellipsis, >1 = multi-line box clamp. */
  lines?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Override popover content (defaults to `children`). */
  full?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  /** Extra style for the popover surface (e.g. a wider maxWidth for paragraphs). */
  cardStyle?: React.CSSProperties;
};

/**
 * Clamp any text and, ONLY when it actually overflows, reveal the full content
 * on hover in a floating card that matches the app's dark glass surface — so a
 * long playlist name / description / track title never deforms the layout yet
 * stays fully readable. The overflow is measured (ResizeObserver), so the popup
 * never appears for text that already fits. Reusable anywhere text can be long.
 */
export function TextReveal({
  children,
  lines = 1,
  className,
  style,
  full,
  side = "bottom",
  align = "start",
  cardStyle,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [clipped, setClipped] = useState(false);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setClipped(el.scrollWidth - el.clientWidth > 1 || el.scrollHeight - el.clientHeight > 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, lines]);

  const clamp: React.CSSProperties =
    lines === 1
      ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
      : {
          display: "-webkit-box",
          WebkitLineClamp: lines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          overflowWrap: "anywhere",
        };

  // Gate `open` on `clipped` so a fitting label never opens the card; when not
  // shown, AnimatePresence renders nothing so there's no popover DOM at all.
  const show = clipped && open;
  return (
    <HoverCard.Root open={show} onOpenChange={setOpen} openDelay={160} closeDelay={80}>
      <HoverCard.Trigger asChild>
        <div ref={ref} className={className} style={{ ...style, ...clamp }}>
          {children}
        </div>
      </HoverCard.Trigger>
      <AnimatePresence>
        {show && (
          <HoverCard.Portal forceMount>
            <HoverCard.Content
              asChild
              forceMount
              side={side}
              align={align}
              sideOffset={8}
              collisionPadding={16}
            >
              <motion.div
                className={cn("textpop", "scroll")}
                style={cardStyle}
                initial={{ opacity: 0, y: 5, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {full ?? children}
              </motion.div>
            </HoverCard.Content>
          </HoverCard.Portal>
        )}
      </AnimatePresence>
    </HoverCard.Root>
  );
}
