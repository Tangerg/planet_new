import { describe, expect, it } from "vitest";

import {
  initialAudioLightFrameState,
  nextAudioLightFrame,
  type AudioLightFrameState,
} from "./audio-light-frame";

describe("audio light frame model", () => {
  // Drive a constant spectrum until the running level settles.
  const run = (bytes: Uint8Array, bandCount = 5, frames = 300) => {
    let state: AudioLightFrameState = initialAudioLightFrameState(bandCount);
    for (let i = 0; i < frames; i++) {
      state = nextAudioLightFrame({ previous: state, bytes, read: true, bandCount });
    }
    return state;
  };

  it("advances a breathing-light frame from sampled FFT bytes", () => {
    const frame = nextAudioLightFrame({
      previous: initialAudioLightFrameState(5),
      bytes: new Uint8Array([250, 220, 180, 120, 90, 40, 20, 10]),
      read: true,
      bandCount: 5,
    });

    expect(frame.bands).toHaveLength(5);
    expect(frame.level).toHaveLength(5);
    expect(Math.max(...frame.bands)).toBeGreaterThan(0);
  });

  it("centres a quiet spectrum at the same level as a loud one (adaptive gain)", () => {
    const loud = run(new Uint8Array([250, 220, 180, 120, 90]));
    const quiet = run(new Uint8Array([25, 22, 18, 12, 9]));
    expect(Math.max(...quiet.bands)).toBeGreaterThan(0.3);
    expect(Math.max(...quiet.bands)).toBeCloseTo(Math.max(...loud.bands), 1);
  });

  it("settles the bands to the baseline when no spectrum is read", () => {
    const frame = nextAudioLightFrame({
      previous: initialAudioLightFrameState(5),
      bytes: new Uint8Array(8),
      read: false,
      bandCount: 5,
    });

    expect(frame.bands).toHaveLength(5);
    expect(Math.max(...frame.bands)).toBe(0);
  });
});
