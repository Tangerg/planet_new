import { describe, expect, it } from "vitest";

import { createAudioEngine, DEFAULT_AUDIO_ENGINE_CONFIG } from "./engine";

// Steady FFT bytes with energy in the musical (low) bins.
function steady(byteLevel: number): Uint8Array {
  const bytes = new Uint8Array(64);
  bytes.fill(byteLevel, 0, 40);
  return bytes;
}

describe("audio engine", () => {
  it("exposes the resolved config and honors tuning", () => {
    const engine = createAudioEngine({ bands: 6, levelContrast: 2 });
    expect(engine.config.bands).toBe(6);
    expect(engine.config.levelContrast).toBe(2);
    expect(engine.config.fftSize).toBe(DEFAULT_AUDIO_ENGINE_CONFIG.fftSize);
  });

  it("produces reactive audio with config.bands bands", () => {
    const engine = createAudioEngine({ bands: 5 });
    const audio = engine.analyze(steady(200), { read: true, playing: true, timeSec: 0 });
    expect(audio.bands).toHaveLength(5);
    expect(audio.overall).toBeGreaterThan(0);
  });

  it("auto-levels loud and quiet steady input to a similar overall", () => {
    const settle = (byteLevel: number) => {
      const engine = createAudioEngine();
      const bytes = steady(byteLevel);
      let audio = engine.analyze(bytes, { read: true, playing: true, timeSec: 0 });
      for (let i = 1; i < 300; i++) {
        audio = engine.analyze(bytes, { read: true, playing: true, timeSec: i / 60 });
      }
      return audio.overall;
    };
    expect(settle(220)).toBeGreaterThan(0.1);
    expect(settle(220)).toBeCloseTo(settle(40), 1);
  });

  it("breathes gently while paused, and reset clears state", () => {
    const engine = createAudioEngine();
    const paused = engine.analyze(new Uint8Array(64), { read: false, playing: false, timeSec: 2 });
    expect(paused.overall).toBeGreaterThan(0); // idle breath, not dead
    expect(() => engine.reset()).not.toThrow();
  });
});
