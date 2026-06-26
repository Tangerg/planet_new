// ============================================================
// Charts — grid of ranked-chart banners.
// ============================================================
import React from "react";
import type { VibeCollection } from "@/model/adapt";
import { ChartCard } from "@/components/cards/ChartCard";
import { FadeIn } from "@/components/motion";
import { MOCK } from "@/model/mock";

type ChartsScreenProps = {
  data: { charts: VibeCollection[] };
  onOpenChart: (chart: VibeCollection) => void;
};

export function ChartsScreen({ data, onOpenChart }: ChartsScreenProps) {
  const charts = data.charts?.length ? data.charts : MOCK.charts;
  return (
    <FadeIn
      className="scroll h-full"
      style={{ background: "radial-gradient(120% 90% at 50% 0%, #16161d, var(--surf-0))" }}
    >
      <div className="px-10 pb-10 pt-[60px]">
        <div className="mb-1.5 text-[36px] font-extralight">Charts</div>
        <div className="mlabel mb-[26px] text-tx-3">Ranked by plays · refreshed daily</div>
        {/* 5-up grid of square tiles; each tile lifts on its own hover
            (neighbours stay put). */}
        <div className="grid grid-cols-5 gap-[16px]">
          {charts.map((c) => (
            <ChartCard
              key={c.id}
              title={c.title ?? c.name}
              time={c.updatedAt ? "Updated " + c.updatedAt : "Top chart"}
              // mock charts carry `seed`; real (toplists) carry `coverSeed`.
              seed={c.coverSeed ?? (c as { seed?: number }).seed ?? 0}
              grad={c.gradient}
              image={c.image}
              onOpen={() => onOpenChart(c)}
            />
          ))}
        </div>
      </div>
    </FadeIn>
  );
}
