import { afterEach, describe, expect, it, vi } from "vitest";

import { Plugin } from "./plugin";
import { Planet } from "./planet";
import type { AudioRuntimePort } from "./context";

afterEach(() => vi.unstubAllGlobals());

function runtime(dispose = vi.fn<() => void>()): AudioRuntimePort {
  return {
    audioElement: { id: "injected-audio" } as unknown as HTMLAudioElement,
    audioContext: { state: "running" } as AudioContext,
    createAnalysisElement: vi.fn<() => HTMLAudioElement>(() => ({}) as HTMLAudioElement),
    dispose,
  };
}

class CaptureAudio extends Plugin {
  readonly id = "capture-audio";
  seenElement: HTMLAudioElement | null = null;
  seenContext: AudioContext | null = null;

  protected override onInit(): void {
    this.seenElement = this.context.audioElement;
    this.seenContext = this.context.audioContext;
  }
}

describe("Planet audio runtime ownership", () => {
  it("uses only the injected resources and disposes them exactly once", () => {
    vi.stubGlobal(
      "Audio",
      class {
        constructor() {
          throw new Error("kernel must not construct Audio");
        }
      },
    );
    vi.stubGlobal(
      "AudioContext",
      class {
        constructor() {
          throw new Error("kernel must not construct AudioContext");
        }
      },
    );

    const audio = runtime();
    const plugin = new CaptureAudio();
    const planet = new Planet({ audio, plugins: [plugin] });

    expect(plugin.seenElement).toBe(audio.audioElement);
    expect(plugin.seenContext).toBe(audio.audioContext);

    planet.dispose();
    planet.dispose();
    expect(audio.dispose).toHaveBeenCalledTimes(1);
  });

  it("releases installed plugins and audio when installation fails", () => {
    const releases: string[] = [];
    const audio = runtime(
      vi.fn(() => {
        releases.push("audio");
      }),
    );

    class Installed extends Plugin {
      readonly id = "installed";
      protected override onDispose(): void {
        releases.push("plugin");
      }
    }
    class Failing extends Plugin {
      readonly id = "failing";
      protected override onInit(): void {
        throw new Error("installation failed");
      }
    }

    expect(() => new Planet({ audio, plugins: [new Installed(), new Failing()] })).toThrow(
      "installation failed",
    );
    expect(releases).toEqual(["plugin", "audio"]);
  });

  it("releases audio when dependency validation fails before installation", () => {
    const audio = runtime();

    class MissingDependency extends Plugin {
      readonly id = "dependent";
      override readonly dependsOn = ["missing"];
    }

    expect(() => new Planet({ audio, plugins: [new MissingDependency()] })).toThrow(
      'plugin "dependent" depends on missing "missing"',
    );
    expect(audio.dispose).toHaveBeenCalledTimes(1);
  });
});
