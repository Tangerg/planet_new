import { describe, expectTypeOf, it } from "vitest";

import type {
  AudioOutputPort,
  PlaybackAvailabilityPolicy,
  PlaybackResolver,
  PlaybackService,
  RandomSource,
} from ".";

describe("Playback Context public API", () => {
  it("exposes playback use cases without catalog composition", () => {
    expectTypeOf<PlaybackService>().toHaveProperty("play");
    expectTypeOf<PlaybackResolver>().toHaveProperty("resolve");
    expectTypeOf<AudioOutputPort>().toHaveProperty("resume");
    expectTypeOf<PlaybackAvailabilityPolicy>().toHaveProperty("canResolveFullPlayback");
    expectTypeOf<RandomSource>().toHaveProperty("next");
    expectTypeOf<PlaybackService>().not.toHaveProperty("search");
    expectTypeOf<PlaybackResolver>().not.toHaveProperty("catalog");
  });
});
