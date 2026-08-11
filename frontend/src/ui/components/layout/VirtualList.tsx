import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useRef, useState } from "react";

import { scrollTopOffset, useMeasuredInScroller } from "@/components/layout/measure";

export type VirtualListProps = {
  /** The scrolling ancestor. The list may sit below other content (a hero, a
   *  header): this component measures its own offset within that scroller and
   *  feeds it to the virtualizer as `scrollMargin`, so it's drop-in anywhere. */
  scrollRef: React.RefObject<HTMLElement | null>;
  count: number;
  /** Fixed row height in px. Rows here are uniform, so a static size keeps the
   *  scroll height and row positions pixel-identical to the non-virtual list. */
  estimateSize: number;
  overscan?: number;
  renderItem: (index: number) => React.ReactNode;
  itemKey?: (index: number) => React.Key;
};

/**
 * Windowed list backed by TanStack Virtual: only the visible rows (plus
 * overscan) are mounted, so a several-hundred-track list scrolls without the
 * lag of rendering every row. The total spacer height matches the full list,
 * leaving the scrollbar and any scroll-driven chrome unchanged.
 */
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
