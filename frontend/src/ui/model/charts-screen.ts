import type { LocalizedText } from "@/i18n/text";

import type { VibeCollection } from "./vibe";

export type ChartTileModel = {
  chart: VibeCollection;
  title: string;
  time: LocalizedText;
  seed: number;
  grad?: string[];
  image?: string;
};

export type ChartsScreenModel = {
  tiles: ChartTileModel[];
  isEmpty: boolean;
};

export function chartTileModel(chart: VibeCollection): ChartTileModel {
  return {
    chart,
    title: chart.title ?? chart.name,
    time: chart.updatedAt
      ? { key: "charts.updated", values: { when: chart.updatedAt } }
      : { key: "charts.topChart" },
    seed: chart.coverSeed ?? 0,
    grad: chart.gradient,
    image: chart.image,
  };
}

export function chartsScreenModel(charts: readonly VibeCollection[] = []): ChartsScreenModel {
  const tiles = charts.map(chartTileModel);
  return {
    tiles,
    isEmpty: tiles.length === 0,
  };
}
