// ============================================================
// Charts — grid of ranked-chart banners.
// ============================================================
import React from "react";
import { useTranslation } from "react-i18next";

import { localize } from "@/i18n/text";
import type { VibeCollection } from "@/model/vibe";
import { chartsScreenModel } from "@/model/charts-screen";
import { ChartCard } from "@/components/cards/ChartCard";
import { PageColumn } from "@/components/layout/PageColumn";
import { FadeIn } from "@/components/motion";

type ChartsScreenProps = {
  data: { charts: VibeCollection[] };
  onOpenChart: (chart: VibeCollection) => void;
};

export function ChartsScreen({ data, onOpenChart }: ChartsScreenProps) {
  const { t } = useTranslation();
  const model = chartsScreenModel(data.charts);
  return (
    <FadeIn
      className="scroll h-full"
      style={{ background: "radial-gradient(120% 90% at 50% 0%, #16161d, var(--surf-0))" }}
    >
      <PageColumn className="pb-10 pt-[60px]">
        <div className="mb-1.5 text-[36px] font-extralight">{t("charts.title")}</div>
        <div className="mlabel mb-[26px] text-tx-3">{t("charts.subtitle")}</div>
        {/* 5-up grid of square tiles; each tile lifts on its own hover
            (neighbours stay put). */}
        <div className="grid grid-cols-5 gap-[16px]">
          {model.tiles.map((tile) => (
            <ChartCard
              key={tile.chart.id}
              title={tile.title}
              time={localize(t, tile.time)}
              seed={tile.seed}
              grad={tile.grad}
              image={tile.image}
              onOpen={() => onOpenChart(tile.chart)}
            />
          ))}
        </div>
      </PageColumn>
    </FadeIn>
  );
}
