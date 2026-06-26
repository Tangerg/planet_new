// ============================================================
// CardRail — windowed horizontal rail (the `.hrail` scroller). Long recommend /
// search rails (dozens of cards) only mount the visible slice plus overscan.
//
// Why not the absolute-positioned virtualizer used for grids/lists: rail cards
// keep their natural flex flow so the hover-lift overflow and the morph rect
// measurement behave exactly as a plain rail. With a fixed item stride (card
// width + gap) the window is just an arithmetic slice, and lead/tail flex
// spacers preserve the full scroll width and scrollbar.
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type CardRailProps = {
  count: number;
  /** Fixed card width in px (rail cards are uniform, e.g. `.mcard` = 176). */
  itemWidth: number;
  /** Gap between cards — must equal the `.hrail` flex gap (18). */
  gap?: number;
  overscan?: number;
  renderItem: (index: number) => React.ReactNode;
  itemKey?: (index: number) => React.Key;
  className?: string;
  style?: React.CSSProperties;
};

export function CardRail({
  count,
  itemWidth,
  gap = 18,
  overscan = 3,
  renderItem,
  itemKey,
  className,
  style,
}: CardRailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const stride = itemWidth + gap;
  const [range, setRange] = useState({ start: 0, end: count });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const start = Math.max(0, Math.floor(el.scrollLeft / stride) - overscan);
      const visible = Math.ceil(el.clientWidth / stride);
      const end = Math.min(count, start + visible + overscan * 2 + 1);
      setRange((r) => (r.start === start && r.end === end ? r : { start, end }));
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [count, stride, overscan]);

  // Clamp to the current count (it can shrink between renders).
  const start = Math.min(range.start, Math.max(0, count));
  const end = Math.min(range.end, count);
  const lead = start * stride - gap; // width of the hidden head items + their inner gaps
  const tail = (count - end) * stride - gap; // …and the hidden tail items

  return (
    <div ref={ref} className={cn("hrail", className)} style={style}>
      {start > 0 && <div aria-hidden className="flex-none" style={{ width: lead }} />}
      {Array.from({ length: Math.max(0, end - start) }, (_, k) => {
        const i = start + k;
        return <React.Fragment key={itemKey ? itemKey(i) : i}>{renderItem(i)}</React.Fragment>;
      })}
      {end < count && <div aria-hidden className="flex-none" style={{ width: tail }} />}
    </div>
  );
}
