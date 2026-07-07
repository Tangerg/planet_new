import { describe, expect, it } from "vitest";

import { initialAudioLightFrameState, nextAudioLightFrame } from "./audio-light-frame";

describe("audio light frame model", () => {
  it("advances a breathing-light frame from sampled FFT bytes", () => {
    const frame = nextAudioLightFrame({
      previous: initialAudioLightFrameState(5),
      bytes: new Uint8Array([250, 220, 180, 120, 90, 40, 20, 10]),
      read: true,
      bandCount: 5,
    });

    expect(frame.bands).toHaveLength(5);
    expect(frame.env).toHaveLength(5);
    expect(Math.max(...frame.bands)).toBeGreaterThan(0);
  });

  it("lifts a quiet spectrum to a comparable level as a loud one (adaptive gain)", () => {
    const loud = nextAudioLightFrame({
      previous: initialAudioLightFrameState(5),
      bytes: new Uint8Array([250, 220, 180, 120, 90]),
      read: true,
      bandCount: 5,
    });
    const quiet = nextAudioLightFrame({
      previous: initialAudioLightFrameState(5),
      bytes: new Uint8Array([25, 22, 18, 12, 9]),
      read: true,
      bandCount: 5,
    });
    expect(Math.max(...quiet.bands)).toBeGreaterThan(0.4);
    expect(Math.max(...quiet.bands)).toBeCloseTo(Math.max(...loud.bands), 5);
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
