import { describe, expect, it, vi } from "vitest";

import { AUDIO_ANALYSER } from "../plugin/audio-engine";
import type { Planet } from "../kernel";
import { AudioAnalysisService } from "./AudioAnalysisService";

function makeService(analyser?: Partial<AnalyserNode>) {
  const port = analyser
    ? {
        analyser: () => analyser as AnalyserNode,
        setSource: vi.fn<(url: string) => Promise<void>>().mockResolvedValue(undefined),
        stop: vi.fn<() => void>(),
      }
    : null;
  const planet = {
    resolve: vi.fn<(cap: unknown) => typeof port>((cap) => (cap === AUDIO_ANALYSER ? port : null)),
  } as unknown as Planet;
  return { service: new AudioAnalysisService(planet), port };
}

describe("AudioAnalysisService", () => {
  it("reports unsupported when no analyser capability is mounted", () => {
    const { service } = makeService();

    expect(service.supported).toBe(false);
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

  it("resolves and starts the analysis-only audio source", async () => {
    const { port } = makeService({ fftSize: 128, frequencyBinCount: 1 });
    const withResolver = new AudioAnalysisService(
      {
        resolve: vi.fn<(cap: unknown) => typeof port>((cap) =>
          cap === AUDIO_ANALYSER ? port : null,
        ),
      } as unknown as Planet,
      (url) => `probe:${url}`,
    );

    await expect(withResolver.useSource("https://cdn.example/song.mp3")).resolves.toBe(true);
    expect(port?.setSource).toHaveBeenCalledWith("probe:https://cdn.example/song.mp3");
  });

  it("stops the probe when no playable source is available", async () => {
    const { service, port } = makeService({ fftSize: 128, frequencyBinCount: 1 });

    await expect(service.useSource(undefined)).resolves.toBe(false);
    expect(port?.stop).toHaveBeenCalledOnce();
  });
});
