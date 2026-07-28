import { describe, expect, it } from "vitest";

import { chartTileModel, chartsScreenModel } from "./charts-screen";
import type { VibeCollection } from "./vibe";

const chart = (overrides: Partial<VibeCollection> = {}): VibeCollection => ({
  id: "chart",
  name: "Hot",
  kind: "Chart",
  coverSeed: 7,
  tracks: [],
  ...overrides,
});

describe("charts screen model", () => {
  it("projects a collection into the chart tile contract", () => {
    expect(
      chartTileModel(
        chart({
          title: "Top 100",
          updatedAt: "today",
          image: "chart.jpg",
          gradient: ["#111", "#222"],
        }),
      ),
    ).toMatchObject({
      title: "Top 100",
      time: { key: "charts.updated", values: { when: "today" } },
      seed: 7,
      image: "chart.jpg",
      grad: ["#111", "#222"],
    });
  });

  it("uses conservative display fallbacks for sparse chart payloads", () => {
    expect(chartTileModel(chart()).title).toBe("Hot");
    expect(chartTileModel(chart()).time).toEqual({ key: "charts.topChart" });
  });

  it("reports whether there are any chart tiles", () => {
    expect(chartsScreenModel([])).toEqual({ tiles: [], isEmpty: true });
    expect(chartsScreenModel([chart()])).toMatchObject({ isEmpty: false });
  });
});
