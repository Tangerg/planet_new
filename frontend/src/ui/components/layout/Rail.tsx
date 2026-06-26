// ============================================================
// Rail — a titled horizontal section: SectionHead ("title" + Show all) over a
// windowed CardRail. The home/search recommendation rails.
// ============================================================
import React from "react";
import { SectionHead } from "@/components/layout/SectionHead";
import { CardRail } from "@/components/layout/CardRail";

type RailProps = {
  title: string;
  onAll?: () => void;
  count: number;
  /** Fixed card width (rail cards are uniform; `.mcard` = 176). */
  itemWidth?: number;
  renderItem: (index: number) => React.ReactNode;
  itemKey?: (index: number) => React.Key;
};

export function Rail({ title, onAll, count, itemWidth = 176, renderItem, itemKey }: RailProps) {
  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHead title={title} onAll={onAll} />
      <CardRail count={count} itemWidth={itemWidth} renderItem={renderItem} itemKey={itemKey} />
    </section>
  );
}
