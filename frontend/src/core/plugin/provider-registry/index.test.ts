import { describe, expect, it } from "vitest";

import { createHost } from "dougong";
import { ProviderId, type MusicSource } from "@domain";
import { musicSourcePlugin, PROVIDER_REGISTRY, providerRegistryPlugin } from ".";

function provider(id: string, name: string): MusicSource {
  return { providerId: ProviderId.of(id), name } as unknown as MusicSource;
}

describe("provider registry", () => {
  it("selects by stable id and ignores unknown or unchanged ids", async () => {
    const netease = provider("netease", "Netease Cloud Music");
    const qqmusic = provider("qqmusic", "QQ Music");
    const host = createHost({ name: "registry-test" });
    host.install(musicSourcePlugin(netease));
    host.install(musicSourcePlugin(qqmusic));
    host.install(providerRegistryPlugin, { defaultActive: netease.providerId });
    await host.start();

    const registry = host.get(PROVIDER_REGISTRY);
    expect(registry.active).toBe(netease);
    expect(registry.get(qqmusic.providerId)).toBe(qqmusic);
    expect(registry.get(ProviderId.of("unknown"))).toBeNull();
    expect(registry.setActive(ProviderId.of("unknown"))).toBe(false);
    expect(registry.active).toBe(netease);

    expect(registry.setActive(qqmusic.providerId)).toBe(true);
    expect(registry.active).toBe(qqmusic);

    expect(registry.setActive(qqmusic.providerId)).toBe(false);
    await host.stop();
  });

  it("sees a source installed after startup without restarting", async () => {
    const netease = provider("netease", "Netease Cloud Music");
    const local = provider("local", "Local Music");
    const host = createHost({ name: "registry-test" });
    host.install(musicSourcePlugin(netease));
    host.install(providerRegistryPlugin, { defaultActive: netease.providerId });
    await host.start();

    const registry = host.get(PROVIDER_REGISTRY);
    expect(registry.providers).toHaveLength(1);

    // An ExtensionPoint is not a dependency edge: the registry Instance stays
    // the same object across the change, it just reads a longer contribution set.
    const installation = host.install(musicSourcePlugin(local));
    await installation.ready();

    expect(host.get(PROVIDER_REGISTRY)).toBe(registry);
    expect(registry.get(local.providerId)).toBe(local);

    await installation.remove();
    expect(registry.get(local.providerId)).toBeNull();
    await host.stop();
  });
});
