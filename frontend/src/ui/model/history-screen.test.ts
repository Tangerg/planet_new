import { describe, expect, it } from "vitest";

import { historyScreenModel } from "./history-screen";
import type { VibeTrack } from "./vibe";
import { ProviderId } from "@domain/model/provider-id";

const TEST_PROVIDER_ID = ProviderId.of("test");

const track = (id: string): VibeTrack => ({
  providerId: TEST_PROVIDER_ID,
  id,
  title: id,
  name: id,
  artist: "Artist",
  coverSeed: 1,
  durSec: 10,
  duration: "0:10",
});

describe("history screen model", () => {
  it("groups session and account history into non-empty display sections", () => {
    const model = historyScreenModel(
      [track("session-old"), track("session-new")],
      [track("week")],
      [track("all")],
    );

    expect(model.hero?.id).toBe("session-new");
    expect(model.total).toBe(4);
    expect(model.isEmpty).toBe(false);
    expect(
      model.sections.map((section) => [section.label, section.items.map((t) => t.id)]),
    ).toEqual([
      ["Today", ["session-new", "session-old"]],
      ["This week", ["week"]],
      ["All-time", ["all"]],
    ]);
  });

  it("drops empty sections and exposes an empty state", () => {
    const model = historyScreenModel([], [], []);

    expect(model).toMatchObject({
      sections: [],
      total: 0,
      hero: undefined,
      isEmpty: true,
    });
  });

  it("keeps a track in the earliest bucket only", () => {
    const model = historyScreenModel(
      [track("same")],
      [track("same"), track("week")],
      [track("same"), track("week"), track("all")],
    );

    expect(model.sections.map((section) => section.items.map((t) => t.id))).toEqual([
      ["same"],
      ["week"],
      ["all"],
    ]);
  });
});
