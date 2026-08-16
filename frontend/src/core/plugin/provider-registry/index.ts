import { definePlugin, extensionPoint, service, type Plugin } from "dougong";
import type { MusicSource, ProviderId } from "@domain";

/**
 * Every music source contributes itself here. An ExtensionPoint rather than a
 * Service because the set is open: sources can be added or removed at runtime
 * without restarting the plugins that read them.
 */
export const MUSIC_SOURCES = extensionPoint<MusicSource>("planet/music-sources");

export interface ProviderRegistryPort {
  /** The active provider, or null when none is registered. */
  get active(): MusicSource | null;
  /** All registered providers, in contribution order. */
  get providers(): readonly MusicSource[];
  /** Resolve a provider by stable id without changing the active browse source. */
  get(providerId: ProviderId): MusicSource | null;
  /** Switch by stable id. Returns false if the id is unknown or unchanged. */
  setActive(providerId: ProviderId): boolean;
}

export const PROVIDER_REGISTRY = service<ProviderRegistryPort>("planet/provider-registry");

class ProviderRegistry implements ProviderRegistryPort {
  private activeId: ProviderId;

  constructor(
    defaultActive: ProviderId,
    private readonly sources: () => readonly MusicSource[],
  ) {
    this.activeId = defaultActive;
  }

  get providers(): readonly MusicSource[] {
    return this.sources();
  }

  get active(): MusicSource | null {
    return this.get(this.activeId) ?? this.providers[0] ?? null;
  }

  get(providerId: ProviderId): MusicSource | null {
    return this.providers.find((provider) => provider.providerId === providerId) ?? null;
  }

  setActive(providerId: ProviderId): boolean {
    const next = this.get(providerId);
    if (!next || next === this.active) return false;
    this.activeId = providerId;
    return true;
  }
}

export type ProviderRegistryConfig = {
  /** The source selected at startup; falls back to the first contributed one. */
  readonly defaultActive: ProviderId;
};

/**
 * Selects the active music provider among all contributed ones — the "plugin
 * that coordinates plugins". React Query and credentials key on stable
 * ProviderId values, so display-name changes cannot mix persisted state.
 *
 * It reads the contribution view on every access instead of snapshotting it, so
 * a provider added or removed later is visible immediately and this
 * installation is never restarted for it.
 */
export const providerRegistryPlugin = definePlugin({
  name: "planet.provider-registry",
  requires: { sources: MUSIC_SOURCES },
  provides: { registry: PROVIDER_REGISTRY },
  setup(ctx, config: ProviderRegistryConfig) {
    return {
      registry: new ProviderRegistry(config.defaultActive, () => [...ctx.sources.get().values()]),
    };
  },
});

/**
 * Wraps one music source as an installable unit. Sources are data, not
 * lifecycles: an adapter has nothing to acquire, so the whole plugin is the
 * contribution and removing the installation withdraws the source.
 */
export function musicSourcePlugin(source: MusicSource): Plugin {
  return definePlugin({
    name: `planet.music-source.${source.providerId}`,
    setup(ctx) {
      ctx.contribute(MUSIC_SOURCES, source.providerId, source);
    },
  });
}
