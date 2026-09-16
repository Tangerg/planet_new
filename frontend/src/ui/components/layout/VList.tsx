import React from "react";
import { VirtualList } from "@/components/layout/VirtualList";
import { useScrollRef, type ScrollRef } from "@/components/layout/ScrollContext";

type VListProps = {
  count: number;
  estimateSize: number;
  renderItem: (index: number) => React.ReactNode;
  itemKey?: (index: number) => React.Key;
  overscan?: number;
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
