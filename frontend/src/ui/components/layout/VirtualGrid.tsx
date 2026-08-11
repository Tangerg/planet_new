import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useRef, useState } from "react";

import { scrollTopOffset, useMeasuredInScroller } from "@/components/layout/measure";

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

/** Column count for `repeat(auto-fill, minmax(minColumnWidth, 1fr))` at this width. */
function autoFillColumns(width: number, minColumnWidth: number, gap: number): number {
  return Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap)));
}

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

  useMeasuredInScroller(
    scrollRef,
    containerRef,
    (el, scroller) => {
      setColumns(autoFillColumns(el.clientWidth, minColumnWidth, gap));
      setScrollMargin(scrollTopOffset(el, scroller));
    },
    `${count}:${minColumnWidth}:${gap}`,
  );

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
