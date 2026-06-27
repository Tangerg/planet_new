import type { Planet } from "../kernel";
import type { MusicProvider } from "@domain";
import { PROVIDER_REGISTRY, type ProviderRegistryPort } from "../plugin";
import { PlaybackService } from "./PlaybackService";
import { MediaService } from "./MediaService";

/**
 * The application-facing facade over the kernel — the single handle the UI
 * holds. It hides the plugin container: the view subscribes to state via
 * `events`, issues commands/use-cases via `playback` / `media`, lists/switches
 * sources via `providers`, and manages the kernel lifecycle via `dispose` — it
 * never resolves plugins or reaches into Planet internals.
 *
 * Provider resolution lives here (not in the UI): both services are bound to a
 * getter that re-reads the active provider from the ProviderRegistry, so a
 * runtime provider switch needs no service rewiring. Dependency direction:
 * core/application → kernel + plugin + domain; never React, never `@providers`.
 */
export class Engine {
  readonly playback: PlaybackService;
  readonly media: MediaService;

  constructor(private readonly planet: Planet) {
    const getProvider = (): MusicProvider => {
      const provider = this.providers.active;
      if (!provider) {
        throw new Error("No music provider is registered on the Planet.");
      }
      return provider;
    };
    this.playback = new PlaybackService(planet, getProvider);
    this.media = new MediaService(getProvider);
  }

  /** The kernel event bus — UI store-bridges subscribe here for playback/state. */
  get events(): Planet["hooks"] {
    return this.planet.hooks;
  }

  /** The provider registry — list the registered sources / switch the active one. */
  get providers(): ProviderRegistryPort {
    const registry = this.planet.resolve(PROVIDER_REGISTRY);
    if (!registry) {
      throw new Error("ProviderRegistry plugin is not registered on the Planet.");
    }
    return registry;
  }

  /** Unmount the kernel (app teardown). */
  dispose(): void {
    this.planet.dispose();
  }
}
