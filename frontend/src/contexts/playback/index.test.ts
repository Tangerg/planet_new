import { describe, expect, expectTypeOf, it } from "vitest";

import { PlaybackResolutionError } from ".";

import type {
  AudioOutputPort,
  PlaybackAvailabilityPolicy,
  PlaybackResolutionOutcome,
  PlaybackResolver,
  PlaybackService,
  PlaybackStartOutcome,
  RandomSource,
} from ".";

describe("Playback Context public API", () => {
  it("exposes playback use cases without catalog composition", () => {
    expectTypeOf<PlaybackService>().toHaveProperty("play");
    expectTypeOf<ReturnType<PlaybackService["play"]>>().toEqualTypeOf<
      Promise<PlaybackStartOutcome>
    >();
    expectTypeOf<PlaybackResolutionOutcome["status"]>().toEqualTypeOf<
      "notRequired" | "resolved" | "partial" | "unresolved" | "sourceUnavailable" | "failed"
    >();
    expect(PlaybackResolutionError).toBeTypeOf("function");
    expectTypeOf<PlaybackResolver>().toHaveProperty("resolve");
    expectTypeOf<AudioOutputPort>().toHaveProperty("resume");
    expectTypeOf<PlaybackAvailabilityPolicy>().toHaveProperty("canResolveFullPlayback");
    expectTypeOf<RandomSource>().toHaveProperty("next");
    expectTypeOf<PlaybackService>().not.toHaveProperty("search");
    expectTypeOf<PlaybackResolver>().not.toHaveProperty("catalog");
  });
});
