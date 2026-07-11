import { describe, expect, it } from "vitest";

import { ProviderId, type MusicSource } from "@domain";
import { Planet, Plugin, type AudioRuntimePort } from "../../kernel";
import { MUSIC_SOURCE, ProviderRegistry } from ".";

function audioRuntime(): AudioRuntimePort {
  return {
    audioElement: {} as HTMLAudioElement,
    audioContext: {} as AudioContext,
    createAnalysisElement: () => ({}) as HTMLAudioElement,
    dispose() {},
  };
}

function provider(id: string, name: string): MusicSource {
  const providerId = ProviderId.of(id);
  return {
    providerId,
    name,
  } as unknown as MusicSource;
}

class RegisterProvider extends Plugin {
  constructor(private readonly provider: MusicSource) {
    super();
  }

  get id(): string {
    return `test-provider:${this.provider.providerId}`;
  }

  protected onInit(): void {
    this.context.registry.provide(MUSIC_SOURCE, this.provider);
  }
}

describe("ProviderRegistry", () => {
  it("selects by stable id and ignores unknown or unchanged ids", () => {
    const netease = provider("netease", "Netease Cloud Music");
    const qqmusic = provider("qqmusic", "QQ Music");
    const registry = new ProviderRegistry(netease.providerId);
    const planet = new Planet({
      audio: audioRuntime(),
      plugins: [new RegisterProvider(netease), new RegisterProvider(qqmusic), registry],
    });

    expect(registry.active).toBe(netease);
    expect(registry.get(qqmusic.providerId)).toBe(qqmusic);
    expect(registry.get(ProviderId.of("unknown"))).toBeNull();
    expect(registry.setActive(ProviderId.of("unknown"))).toBe(false);
    expect(registry.active).toBe(netease);

    expect(registry.setActive(qqmusic.providerId)).toBe(true);
    expect(registry.active).toBe(qqmusic);

    expect(registry.setActive(qqmusic.providerId)).toBe(false);
    planet.dispose();
  });
});
