import React from "react";
import { VirtualGrid } from "@/components/layout/VirtualGrid";
import { useScrollRef, type ScrollRef } from "@/components/layout/ScrollContext";

type CardGridProps = {
  count: number;
  minColumnWidth: number;
  gap: number;
  estimateRowHeight: number;
  renderItem: (index: number) => React.ReactNode;
  itemKey?: (index: number) => React.Key;
  overscan?: number;
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
        className="grid"
        style={{
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
