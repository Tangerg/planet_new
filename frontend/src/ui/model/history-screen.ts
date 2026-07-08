import { groupPlayHistory } from "./play-history";
import type { VibeTrack } from "./vibe";

export type HistorySectionLabel = "Today" | "This week" | "All-time";

export type HistorySection = {
  label: HistorySectionLabel;
  items: VibeTrack[];
};

export type HistoryScreenModel = {
  sections: HistorySection[];
  total: number;
  hero?: VibeTrack;
  isEmpty: boolean;
};

export function historyScreenModel(
  session: readonly VibeTrack[],
  week: readonly VibeTrack[],
  all: readonly VibeTrack[],
): HistoryScreenModel {
  const groups = groupPlayHistory([...session], [...week], [...all]);
  const allSections: HistorySection[] = [
    { label: "Today", items: groups.today },
    { label: "This week", items: groups.week },
    { label: "All-time", items: groups.earlier },
  ];
  const sections = allSections.filter((section) => section.items.length > 0);

  return {
    sections,
    total: groups.total,
    hero: groups.hero,
    isEmpty: groups.total === 0,
  };
}
