import { describe, expect, it } from "vitest";

import { initialAudioLightFrameState, nextAudioLightFrame } from "./audio-light-frame";

describe("audio light frame model", () => {
  it("advances a breathing-light frame from sampled FFT bytes", () => {
    const frame = nextAudioLightFrame({
      previous: initialAudioLightFrameState(5),
      bytes: new Uint8Array([250, 220, 180, 120, 90, 40, 20, 10]),
      read: true,
      timeMs: 1200,
      bandCount: 5,
    });

    expect(frame.bands).toHaveLength(5);
    expect(frame.profile.active).toBe(true);
    expect(frame.energy).toBeGreaterThan(0.1);
  });

  it("falls back to an idle breath when no spectrum is read", () => {
    const frame = nextAudioLightFrame({
      previous: initialAudioLightFrameState(5),
      bytes: new Uint8Array(8),
      read: false,
      timeMs: 1800,
      bandCount: 5,
    });

    expect(frame.bands).toHaveLength(5);
    expect(frame.profile.active).toBe(false);
    expect(frame.energy).toBeGreaterThan(0);
  });
});
