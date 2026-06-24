import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useLayoutEffect, useRef, useState } from "react";

export type VirtualGridProps = {
  /** The scrolling ancestor (the grid may sit below a hero/header). */
  scrollRef: React.RefObject<HTMLElement | null>;
  count: number;
  /** Min column width; column count matches CSS repeat(auto-fill, minmax(w,1fr)). */
  minColumnWidth: number;
  gap: number;
  /** Initial per-row height guess; the real height is measured per row. */
  estimateRowHeight: number;
  overscan?: number;
  renderItem: (index: number) => React.ReactNode;
  itemKey?: (index: number) => React.Key;
};

/**
 * Windowed responsive grid backed by TanStack Virtual. Columns are derived from
 * the measured width with the same formula CSS `auto-fill` uses, so the layout
 * matches a plain grid; only the on-screen rows (plus overscan) are mounted, and
 * each row's height is measured so variable cover sizes stay aligned.
 */
export function VirtualGrid({
  scrollRef,
  count,
  minColumnWidth,
  gap,
  estimateRowHeight,
  overscan = 4,
  renderItem,
  itemKey,
}: VirtualGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [columns, setColumns] = useState(1);

  // Keep mutable refs so the ResizeObserver callback always reads the latest
  // gap/minColumnWidth without needing them in deps (observer stays stable).
  const gapRef = useRef(gap);
  gapRef.current = gap;
  const minColumnWidthRef = useRef(minColumnWidth);
  minColumnWidthRef.current = minColumnWidth;

  // Stable ResizeObserver — never recreated when count/gap/minColumnWidth
  // change, since the callback always reads the latest DOM dimensions from refs.
  useLayoutEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      const scroller = scrollRef.current;
      if (!el || !scroller) return;
      const width = el.clientWidth;
      const _gap = gapRef.current;
      const _minW = minColumnWidthRef.current;
      setColumns(Math.max(1, Math.floor((width + _gap) / (_minW + _gap))));
      setScrollMargin(
        el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop,
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (scrollRef.current) ro.observe(scrollRef.current);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps — gap/minColumnWidth
    // are read through stable refs; scrollRef is a stable RefObject
  }, [scrollRef]);

  // Re-measure when dependent values change (avoids stale columns/scrollMargin
  // without touching the observer).
  useLayoutEffect(() => {
    const el = containerRef.current;
    const scroller = scrollRef.current;
    if (!el || !scroller) return;
    const width = el.clientWidth;
    setColumns(Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap))));
    setScrollMargin(
      el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps — scrollRef is a stable RefObject
  }, [count, gap, minColumnWidth]);

  const rowCount = Math.ceil(count / columns);
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
    scrollMargin,
    gap,
  });

  return (
    <div ref={containerRef} style={{ position: "relative", height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((row) => {
        const cells: number[] = [];
        for (let c = 0; c < columns && row.index * columns + c < count; c++) {
          cells.push(row.index * columns + c);
        }
        return (
          <div
            key={row.key}
            data-index={row.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${row.start - scrollMargin}px)`,
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap,
            }}
          >
            {cells.map((i) => (
              <div key={itemKey ? itemKey(i) : i}>{renderItem(i)}</div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
