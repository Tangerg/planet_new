import { describe, expect, it, vi } from "vitest";

import type { MediaAnalysisSourceResolver } from "../media-source";
import { AudioAnalysisProbe } from "./analysis-probe";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function makeProbeElement(currentTime = 0) {
  const probe = {
    src: "",
    preload: "",
    crossOrigin: "",
    currentTime,
    play: vi.fn<() => Promise<void>>(async () => {}),
    pause: vi.fn<() => void>(),
    load: vi.fn<() => void>(),
    removeAttribute: vi.fn<(name: string) => void>((name) => {
      if (name === "src") probe.src = "";
    }),
  };
  return probe as unknown as HTMLAudioElement;
}

function makeAudioContext(state: AudioContextState = "running") {
  const source = {
    connect: vi.fn<(node: unknown) => void>(),
    disconnect: vi.fn<() => void>(),
  };
  const analyser = {
    connect: vi.fn<(node: unknown) => void>(),
    disconnect: vi.fn<() => void>(),
  };
  const gain = {
    gain: { value: 1 },
    connect: vi.fn<(node: unknown) => void>(),
    disconnect: vi.fn<() => void>(),
  };
  const audioContext = {
    state,
    destination: {},
    resume: vi.fn<() => Promise<void>>(async () => {}),
    createMediaElementSource: vi.fn<(element: HTMLMediaElement) => typeof source>(() => source),
    createAnalyser: vi.fn<() => typeof analyser>(() => analyser),
    createGain: vi.fn<() => typeof gain>(() => gain),
  } as unknown as AudioContext;

  return { audioContext, source, analyser, gain };
}

function makeFixture({
  state = "running",
  mainTime = 0,
  probeTime = 0,
  resolveAnalysisSource,
}: {
  state?: AudioContextState;
  mainTime?: number;
  probeTime?: number;
  resolveAnalysisSource?: MediaAnalysisSourceResolver;
} = {}) {
  const createdProbe = makeProbeElement(probeTime);
  const playbackElement = { currentTime: mainTime } as HTMLAudioElement;
  const audio = makeAudioContext(state);
  const subject = new AudioAnalysisProbe({
    audioContext: audio.audioContext,
    playbackElement,
    resolveAnalysisSource,
    createProbeElement: () => createdProbe,
    clock: { now: () => 2_000 },
  });

  return { subject, createdProbe, playbackElement, ...audio };
}

describe("AudioAnalysisProbe", () => {
  it("creates a silent analysis graph once and syncs to playback time", () => {
    const { subject, createdProbe, audioContext, source, analyser, gain } = makeFixture({
      mainTime: 32,
      probeTime: 0,
    });

    expect(subject.analyser()).toBe(analyser);
    expect(subject.analyser()).toBe(analyser);

    expect(audioContext.createMediaElementSource).toHaveBeenCalledTimes(1);
    expect(audioContext.createMediaElementSource).toHaveBeenCalledWith(createdProbe);
    expect(source.connect).toHaveBeenCalledWith(analyser);
    expect(analyser.connect).toHaveBeenCalledWith(gain);
    expect(gain.gain.value).toBe(0);
    expect(gain.connect).toHaveBeenCalledWith(audioContext.destination);
    expect(createdProbe.currentTime).toBe(32);
  });

  it("loads the resolved analysis URL and plays only when playback is active", async () => {
    const resolveAnalysisSource: MediaAnalysisSourceResolver = vi.fn<
      (playUrl: string) => Promise<string>
    >(async () => "loopback:track");
    const { subject, createdProbe, audioContext } = makeFixture({
      state: "suspended",
      mainTime: 12,
      resolveAnalysisSource,
    });

    await subject.load("provider:track", () => true);

    expect(resolveAnalysisSource).toHaveBeenCalledWith("provider:track");
    expect(createdProbe.src).toBe("loopback:track");
    expect(createdProbe.crossOrigin).toBe("anonymous");
    expect(createdProbe.load).toHaveBeenCalled();
    expect(audioContext.resume).toHaveBeenCalled();
    expect(createdProbe.play).toHaveBeenCalled();
    expect(createdProbe.currentTime).toBe(12);
  });

  it("falls back to the provider URL when analysis URL resolution fails", async () => {
    const resolveAnalysisSource: MediaAnalysisSourceResolver = vi.fn<
      (playUrl: string) => Promise<string>
    >(async () => {
      throw new Error("proxy unavailable");
    });
    const { subject, createdProbe } = makeFixture({ resolveAnalysisSource });

    await subject.load("provider:track", () => false);

    expect(createdProbe.src).toBe("provider:track");
    expect(createdProbe.play).not.toHaveBeenCalled();
  });

  it("does not let a stale async load overwrite the newest source", async () => {
    const first = deferred<string>();
    const resolveAnalysisSource: MediaAnalysisSourceResolver = vi
      .fn<(playUrl: string) => Promise<string>>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce("loopback:second");
    const { subject, createdProbe } = makeFixture({ resolveAnalysisSource });

    const firstLoad = subject.load("provider:first", () => false);
    await subject.load("provider:second", () => false);

    expect(createdProbe.src).toBe("loopback:second");
    first.resolve("loopback:first");
    await firstLoad;

    expect(createdProbe.src).toBe("loopback:second");
  });

  it("invalidates pending loads on dispose", async () => {
    const first = deferred<string>();
    const resolveAnalysisSource: MediaAnalysisSourceResolver = vi.fn<
      (playUrl: string) => Promise<string>
    >(() => first.promise);
    const { subject, createdProbe } = makeFixture({ resolveAnalysisSource });

    const load = subject.load("provider:first", () => true);
    subject.dispose();
    first.resolve("loopback:first");
    await load;

    expect(createdProbe.src).toBe("");
    expect(createdProbe.load).not.toHaveBeenCalled();
    expect(createdProbe.play).not.toHaveBeenCalled();
  });

  it("clears media and disconnects graph on dispose", () => {
    const { subject, createdProbe, source, analyser, gain } = makeFixture();

    subject.analyser();
    subject.dispose();

    expect(createdProbe.pause).toHaveBeenCalled();
    expect(createdProbe.removeAttribute).toHaveBeenCalledWith("src");
    expect(createdProbe.load).toHaveBeenCalled();
    expect(source.disconnect).toHaveBeenCalled();
    expect(analyser.disconnect).toHaveBeenCalled();
    expect(gain.disconnect).toHaveBeenCalled();
  });
});
