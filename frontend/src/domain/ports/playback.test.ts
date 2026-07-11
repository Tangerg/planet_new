import { describe, expectTypeOf, it } from "vitest";

import type { AudioOutputPort, PlaybackResolver } from "./playback";

describe("playback port boundaries", () => {
  it("keeps resolver and audio output independent from catalog/provider APIs", () => {
    expectTypeOf<PlaybackResolver>().toHaveProperty("policy");
    expectTypeOf<PlaybackResolver>().toHaveProperty("resolve");
    expectTypeOf<PlaybackResolver>().not.toHaveProperty("search");
    expectTypeOf<PlaybackResolver>().not.toHaveProperty("playlistDetail");
    expectTypeOf<PlaybackResolver>().not.toHaveProperty("supports");

    expectTypeOf<AudioOutputPort>().toHaveProperty("resume");
    expectTypeOf<AudioOutputPort>().toHaveProperty("pause");
    expectTypeOf<AudioOutputPort>().toHaveProperty("stop");
    expectTypeOf<AudioOutputPort>().not.toHaveProperty("audioElement");
  });
});
