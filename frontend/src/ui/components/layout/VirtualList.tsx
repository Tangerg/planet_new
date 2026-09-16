import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useRef, useState } from "react";

import { scrollTopOffset, useMeasuredInScroller } from "@/components/layout/measure";

export type VirtualListProps = {
  scrollRef: React.RefObject<HTMLElement | null>;
  count: number;
  estimateSize: number;
  overscan?: number;
  renderItem: (index: number) => React.ReactNode;
  itemKey?: (index: number) => React.Key;
};

export function VirtualList({
  scrollRef,
  count,
  estimateSize,
  overscan = 8,
  renderItem,
  itemKey,
}: VirtualListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useMeasuredInScroller(
    scrollRef,
    containerRef,
    (el, scroller) => setScrollMargin(scrollTopOffset(el, scroller)),
    count,
  );

  // oxlint-disable-next-line react/incompatible-library
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan,
    scrollMargin,
  });

  return (
    <div ref={containerRef} style={{ position: "relative", height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((vi) => (
        <div
          key={itemKey ? itemKey(vi.index) : vi.index}
          data-index={vi.index}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${vi.start - scrollMargin}px)`,
          }}
        >
          {renderItem(vi.index)}
        </div>
      ))}
    </div>
  );
}
