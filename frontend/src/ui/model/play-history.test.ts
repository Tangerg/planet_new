import { describe, expect, it } from "vitest";

import { appendPlayHistoryTrack, groupPlayHistory } from "./play-history";
import type { VibeTrack } from "./vibe";

const track = (id: string): VibeTrack => ({
  id,
  title: id,
  name: id,
  artist: "Artist",
  coverSeed: 1,
  durSec: 10,
  duration: "0:10",
});

describe("play history model", () => {
  it("records session history while dropping consecutive duplicates", () => {
    const first = track("first");
    const second = track("second");

    expect(appendPlayHistoryTrack([], undefined)).toEqual([]);
    expect(appendPlayHistoryTrack([first], first)).toEqual([first]);
    expect(appendPlayHistoryTrack([first], second)).toEqual([first, second]);
  });

  it("groups session and account records without duplicating tracks across buckets", () => {
    const groups = groupPlayHistory(
      [track("session-old"), track("session-new")],
      [track("session-new"), track("week")],
      [track("week"), track("all")],
    );

    expect(groups.today.map((item) => item.id)).toEqual(["session-new", "session-old"]);
    expect(groups.week.map((item) => item.id)).toEqual(["week"]);
    expect(groups.earlier.map((item) => item.id)).toEqual(["all"]);
    expect(groups.total).toBe(4);
    expect(groups.hero?.id).toBe("session-new");
  });
});
