import { describe, expectTypeOf, it } from "vitest";

import type { MusicSource } from "./provider";

describe("MusicSource registration boundary", () => {
  it("composes actual context ports without legacy capability metadata", () => {
    expectTypeOf<MusicSource>().toHaveProperty("catalog");
    expectTypeOf<MusicSource>().toHaveProperty("playback");
    expectTypeOf<MusicSource>().toHaveProperty("lyrics");
    expectTypeOf<MusicSource>().toHaveProperty("identity");
    expectTypeOf<MusicSource>().toHaveProperty("userLibrary");
    expectTypeOf<MusicSource>().toHaveProperty("engagement");

    expectTypeOf<MusicSource>().not.toHaveProperty("capabilities");
    expectTypeOf<MusicSource>().not.toHaveProperty("supports");
    expectTypeOf<MusicSource>().not.toHaveProperty("playUrls");
    expectTypeOf<MusicSource>().not.toHaveProperty("lyric");
  });
});
