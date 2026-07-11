import { afterEach, describe, expect, it, vi } from "vitest";

import { WebAudioRuntime } from "./WebAudioRuntime";

afterEach(() => vi.unstubAllGlobals());

describe("WebAudioRuntime", () => {
  it("owns browser audio creation and releases both resources once", () => {
    const audioElement = {
      pause: vi.fn<() => void>(),
      removeAttribute: vi.fn<(name: string) => void>(),
      load: vi.fn<() => void>(),
    };
    const audioContext = { close: vi.fn<() => Promise<void>>().mockResolvedValue(undefined) };
    const AudioConstructor = vi.fn<() => typeof audioElement>(function () {
      return audioElement;
    });
    const AudioContextConstructor = vi.fn<() => typeof audioContext>(function () {
      return audioContext;
    });
    vi.stubGlobal("Audio", AudioConstructor);
    vi.stubGlobal("AudioContext", AudioContextConstructor);

    const runtime = new WebAudioRuntime();

    expect(runtime.audioElement).toBe(audioElement);
    expect(runtime.audioContext).toBe(audioContext);
    expect(AudioConstructor).toHaveBeenCalledTimes(1);
    expect(AudioContextConstructor).toHaveBeenCalledTimes(1);
    expect(runtime.createAnalysisElement()).toBe(audioElement);
    expect(AudioConstructor).toHaveBeenCalledTimes(2);

    runtime.dispose();
    runtime.dispose();

    expect(audioElement.pause).toHaveBeenCalledTimes(1);
    expect(audioElement.removeAttribute).toHaveBeenCalledWith("src");
    expect(audioElement.load).toHaveBeenCalledTimes(1);
    expect(audioContext.close).toHaveBeenCalledTimes(1);
    expect(() => runtime.createAnalysisElement()).toThrow("audio runtime is disposed");
  });
});
