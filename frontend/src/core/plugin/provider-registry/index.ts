import { Plugin, defineCapability } from "../../kernel";
import type { MusicProvider } from "@domain";

/** Every music source registers itself here; resolveAll yields them all. */
export const MUSIC_PROVIDER = defineCapability<MusicProvider>("music-provider");

export interface ProviderRegistryPort {
  /** The active provider, or null when none is registered. */
  get active(): MusicProvider | null;
  /** All registered providers, in mount order. */
  get providers(): readonly MusicProvider[];
  /** Switch the active provider by name; no-op if unknown or unchanged. */
  setActive(name: string): void;
}

export const PROVIDER_REGISTRY = defineCapability<ProviderRegistryPort>("provider-registry");

declare module "../../kernel/event" {
  interface PlanetEventMap {
    "provider:changed": string;
  }
}

/**
 * Selects the active music provider among all registered ones — the "plugin
 * that coordinates plugins". Every provider publishes MUSIC_PROVIDER; this
 * resolves them and exposes a single active one (switchable at runtime) to the
 * services and the lyrics plugin. The UI's React Query caches key on the
 * provider name, so switching isolates cached data automatically.
 */
export class ProviderRegistry extends Plugin implements ProviderRegistryPort {
  public static readonly ID = "provider-registry";
  private activeName: string;

  constructor(defaultActive: string) {
    super();
    this.activeName = defaultActive;
  }

  get id(): string {
    return ProviderRegistry.ID;
  }

  protected onInit(): void {
    this.context.registry.provide(PROVIDER_REGISTRY, this);
  }

  get providers(): readonly MusicProvider[] {
    return this.context.registry.resolveAll(MUSIC_PROVIDER);
  }

  get active(): MusicProvider | null {
    const all = this.providers;
    return all.find((p) => p.name === this.activeName) ?? all[0] ?? null;
  }

  setActive(name: string): void {
    if (name === this.activeName) return;
    this.activeName = name;
    this.context.hooks.emit("provider:changed", name);
  }
}
