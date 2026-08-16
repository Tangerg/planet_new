import { describe, expect, it, vi } from "vitest";

import type { AnalyserPort } from "../plugin/audio-engine";
import { AudioAnalysisService } from "./AudioAnalysisService";

function makeService(analyser?: Partial<AnalyserNode>) {
  const port = (): AnalyserPort => {
    if (!analyser) throw new Error("Service 'planet/audio-analyser' is not active");
    return { analyser: () => analyser as AnalyserNode };
  };
  return { service: new AudioAnalysisService(port) };
}

describe("AudioAnalysisService", () => {
  it("reports a failed sample when the analyser Service is not active", () => {
    const { service } = makeService();

    expect(service.sampleFrequencyData(new Uint8Array(1))).toBe(false);
  });

  it("configures and samples the shared analyser", () => {
    const getByteFrequencyData = vi.fn<(target: Uint8Array<ArrayBuffer>) => void>((target) =>
      target.set([0, 128, 255, 64]),
    );
    const analyser = {
      fftSize: 2048,
      frequencyBinCount: 4,
      smoothingTimeConstant: 0,
      minDecibels: -100,
      maxDecibels: -30,
      getByteFrequencyData,
    };
    const { service } = makeService(analyser);
    const target = new Uint8Array(4);

    expect(
      service.sampleFrequencyData(target, {
        fftSize: 128,
        smoothingTimeConstant: 0.8,
        minDecibels: -92,
        maxDecibels: -18,
      }),
    ).toBe(true);

    expect(analyser.fftSize).toBe(128);
    expect(analyser.smoothingTimeConstant).toBe(0.8);
    expect(analyser.minDecibels).toBe(-92);
    expect(analyser.maxDecibels).toBe(-18);
    expect([...target]).toEqual([0, 128, 255, 64]);
    expect(getByteFrequencyData).toHaveBeenCalledTimes(1);
  });

  it("does not sample into a mismatched buffer", () => {
    const getByteFrequencyData = vi.fn<(target: Uint8Array<ArrayBuffer>) => void>();
    const { service } = makeService({
      fftSize: 128,
      frequencyBinCount: 4,
      getByteFrequencyData,
    });

    expect(service.sampleFrequencyData(new Uint8Array(2), { fftSize: 128 })).toBe(false);
    expect(getByteFrequencyData).not.toHaveBeenCalled();
  });
});
