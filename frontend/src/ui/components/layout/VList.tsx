// ============================================================
// VList — windowed vertical list for the vibe screens. A thin composition over
// the generic VirtualList (ui/components): it sources the scroll container from
// ScrollContext (so screens don't prop-drill a ref) and degrades to a plain
// stacked render when no scroller is in scope. Content-agnostic: callers pass
// renderItem, so it lists TrackRows, CollectionRows, anything (composition, not
// a content-specific god list).
// ============================================================
import React from "react";
import { VirtualList } from "@/components/layout/VirtualList";
import { useScrollRef, type ScrollRef } from "@/components/layout/ScrollContext";

type VListProps = {
  count: number;
  /** Fixed row height (uniform rows) — feeds the virtualizer's estimate. */
  estimateSize: number;
  renderItem: (index: number) => React.ReactNode;
  itemKey?: (index: number) => React.Key;
  overscan?: number;
  /** Explicit scroller; defaults to the enclosing screen's ScrollContext. */
  scrollRef?: ScrollRef;
};

export function VList({
  count,
  estimateSize,
  renderItem,
  itemKey,
  overscan,
  scrollRef,
}: VListProps) {
  const ctx = useScrollRef();
  const scroller = scrollRef ?? ctx;
  if (!scroller) {
    // No scroll container in scope — render every row (small/bounded lists, or a
    // missing provider). Correct, just not windowed.
    return (
      <>
        {Array.from({ length: count }, (_, i) => (
          <React.Fragment key={itemKey ? itemKey(i) : i}>{renderItem(i)}</React.Fragment>
        ))}
      </>
    );
  }
  return (
    <VirtualList
      scrollRef={scroller}
      count={count}
      estimateSize={estimateSize}
      overscan={overscan}
      renderItem={renderItem}
      itemKey={itemKey}
    />
  );
}
