// ============================================================
// CardGrid — windowed responsive cover grid. Composition over the generic
// VirtualGrid (ui/components): sources the scroller from ScrollContext and
// degrades to a plain CSS grid (identical `auto-fill` track sizing) when no
// scroller is in scope. Content-agnostic — callers pass renderItem.
// ============================================================
import React from "react";
import { VirtualGrid } from "@/components/layout/VirtualGrid";
import { useScrollRef, type ScrollRef } from "@/components/layout/ScrollContext";

type CardGridProps = {
  count: number;
  /** Min column width — column count matches CSS repeat(auto-fill, minmax(w,1fr)). */
  minColumnWidth: number;
  gap: number;
  /** Initial per-row height guess; real heights are measured per row. */
  estimateRowHeight: number;
  renderItem: (index: number) => React.ReactNode;
  itemKey?: (index: number) => React.Key;
  overscan?: number;
  /** Explicit scroller; defaults to the enclosing screen's ScrollContext. */
  scrollRef?: ScrollRef;
};

export function CardGrid({
  count,
  minColumnWidth,
  gap,
  estimateRowHeight,
  renderItem,
  itemKey,
  overscan,
  scrollRef,
}: CardGridProps) {
  const ctx = useScrollRef();
  const scroller = scrollRef ?? ctx;
  if (!scroller) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}px, 1fr))`,
          gap,
        }}
      >
        {Array.from({ length: count }, (_, i) => (
          <div key={itemKey ? itemKey(i) : i}>{renderItem(i)}</div>
        ))}
      </div>
    );
  }
  return (
    <VirtualGrid
      scrollRef={scroller}
      count={count}
      minColumnWidth={minColumnWidth}
      gap={gap}
      estimateRowHeight={estimateRowHeight}
      overscan={overscan}
      renderItem={renderItem}
      itemKey={itemKey}
    />
  );
}
