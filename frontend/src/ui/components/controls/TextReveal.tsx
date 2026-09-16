import React, { useLayoutEffect, useRef, useState } from "react";

import { HoverCard } from "@/components/controls/HoverCard";
import type { PopupAlign, PopupSide } from "@/components/controls/popup";
import { cn } from "@/lib/cn";
import "./TextReveal.css";

type Props = {
  children: React.ReactNode;
  lines?: number;
  className?: string;
  style?: React.CSSProperties;
  full?: React.ReactNode;
  side?: PopupSide;
  align?: PopupAlign;
  cardStyle?: React.CSSProperties;
};

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

  return (
    <HoverCard
      open={clipped && open}
      onOpenChange={setOpen}
      openDelay={160}
      closeDelay={80}
      side={side}
      align={align}
      sideOffset={8}
      collisionPadding={16}
      className={cn("textpop", "scroll")}
      style={cardStyle}
      trigger={
        <div ref={ref} className={className} style={{ ...style, ...clamp }}>
          {children}
        </div>
      }
    >
      {full ?? children}
    </HoverCard>
  );
}
