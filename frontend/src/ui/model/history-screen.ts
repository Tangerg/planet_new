import type { MessageKey } from "@/i18n/text";

import { groupPlayHistory } from "./play-history";
import type { VibeTrack } from "./vibe";

export type HistorySection = {
  /** Section heading; a bare key because a section never interpolates. */
  labelKey: MessageKey;
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
  const groups = groupPlayHistory(session, week, all);
  const allSections: HistorySection[] = [
    { labelKey: "history.sectionToday", items: groups.today },
    { labelKey: "history.sectionWeek", items: groups.week },
    { labelKey: "history.sectionAllTime", items: groups.earlier },
  ];
  const sections = allSections.filter((section) => section.items.length > 0);

  return {
    sections,
    total: groups.total,
    hero: groups.hero,
    isEmpty: groups.total === 0,
  };
}
