import { describe, expect, it } from "vitest";

import { queueHeroModel, queueItemKey, queueScreenModel } from "./queue-screen";
import type { VibeTrack } from "./vibe";

const track = (id: string, overrides: Partial<VibeTrack> = {}): VibeTrack => ({
  id,
  title: id,
  name: id,
  artist: "Artist",
  coverSeed: 9,
  durSec: 10,
  duration: "0:10",
  ...overrides,
});

describe("queue screen model", () => {
  it("projects the current track into a stable hero model", () => {
    expect(
      queueHeroModel(
        track("now", {
          artist: "Singer",
          coverSeed: 42,
          gradient: ["#111", "#222"],
          image: "now.jpg",
        }),
      ),
    ).toMatchObject({
      artist: "Singer",
      coverSeed: 42,
      gradient: ["#111", "#222"],
      image: "now.jpg",
      title: "now",
    });
  });

  it("uses empty hero fallbacks when nothing is playing", () => {
    expect(queueHeroModel(undefined)).toEqual({
      artist: "",
      coverSeed: 0,
      gradient: undefined,
      image: undefined,
      images: undefined,
      title: "",
    });
  });

  it("summarizes queue state and item identity", () => {
    const first = track("a");
    const second = track("b");
    const model = queueScreenModel(first, [first, second]);

    expect(model).toMatchObject({
      count: 2,
      isEmpty: false,
      label: "Up Next · 2",
    });
    expect(queueItemKey(second, 1)).toBe("b1");
    expect(queueScreenModel(first, [])).toMatchObject({ isEmpty: true, label: "Up Next · 0" });
  });
});
