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
      className="scroll"
      style={{
        height: "100%",
        background: "radial-gradient(120% 90% at 50% 0%, #16161d, var(--surf-0))",
      }}
    >
      <div style={{ padding: "60px 40px 40px" }}>
        <div style={{ fontSize: 36, fontWeight: 200, marginBottom: 6 }}>Charts</div>
        <div className="mlabel" style={{ color: "var(--tx-3)", marginBottom: 26 }}>
          Ranked by plays · refreshed daily
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
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
