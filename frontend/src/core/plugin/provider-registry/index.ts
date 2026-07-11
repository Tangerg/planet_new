import { Plugin, defineCapability } from "../../kernel";
import type { MusicSource, ProviderId } from "@domain";

/** Every music source registers itself here; resolveAll yields them all. */
export const MUSIC_SOURCE = defineCapability<MusicSource>("music-source");

export interface ProviderRegistryPort {
  /** The active provider, or null when none is registered. */
  get active(): MusicSource | null;
  /** All registered providers, in mount order. */
  get providers(): readonly MusicSource[];
  /** Resolve a provider by stable id without changing the active browse source. */
  get(providerId: ProviderId): MusicSource | null;
  /** Switch by stable id. Returns false if the id is unknown or unchanged. */
  setActive(providerId: ProviderId): boolean;
}

export const PROVIDER_REGISTRY = defineCapability<ProviderRegistryPort>("provider-registry");

/**
 * Selects the active music provider among all registered ones — the "plugin
 * that coordinates plugins". Every provider publishes MUSIC_SOURCE; this
 * resolves them and exposes a single active one (switchable at runtime) to the
 * services and the lyrics plugin. React Query and credentials key on stable
 * ProviderId values, so display-name changes cannot mix persisted state.
 */
export class ProviderRegistry extends Plugin implements ProviderRegistryPort {
  public static readonly ID = "provider-registry";
  private activeId: ProviderId;

  constructor(defaultActive: ProviderId) {
    super();
    this.activeId = defaultActive;
  }

  get id(): string {
    return ProviderRegistry.ID;
  }

  protected onInit(): void {
    this.context.registry.provide(PROVIDER_REGISTRY, this);
  }

  get providers(): readonly MusicSource[] {
    return this.context.registry.resolveAll(MUSIC_SOURCE);
  }

  get active(): MusicSource | null {
    const all = this.providers;
    return this.get(this.activeId) ?? all[0] ?? null;
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
