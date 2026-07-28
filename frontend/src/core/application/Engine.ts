import type { Planet } from "../kernel";
import type {
  CredentialStore,
  IdentitySourcePort,
  MusicSource,
  PlaybackResolverRegistry,
  ProviderId,
} from "@domain";
import type { UserLibrarySourcePort } from "@domain/ports/userLibrary";
import { PROVIDER_REGISTRY, type ProviderRegistryPort } from "../plugin";
import { AudioAnalysisService } from "./AudioAnalysisService";
import { EngagementService } from "./EngagementService";
import { IdentityService } from "./IdentityService";
import { LibraryService } from "./LibraryService";
import { MediaService } from "./MediaService";
import { PlaybackService } from "./PlaybackService";

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
 * Sibling use cases are imported relatively: `@contexts/*` is the surface the
 * layers ABOVE consume, and routing back through it would make this file look
 * like an outside consumer of its own layer.
 */
export class Engine {
  readonly playback: PlaybackService;
  readonly media: MediaService;
  readonly identity: IdentityService;
  readonly library: LibraryService;
  readonly engagement: EngagementService;
  readonly audio: AudioAnalysisService;

  constructor(
    private readonly planet: Planet,
    credentials: CredentialStore,
  ) {
    const getSource = (): MusicSource => {
      const provider = this.providers.active;
      if (!provider) {
        throw new Error("No music provider is registered on the Planet.");
      }
      return provider;
    };
    const playbackResolvers: PlaybackResolverRegistry = {
      active: () => getSource().playback,
      get: (providerId: ProviderId) => {
        return this.providers.get(providerId)?.playback ?? null;
      },
    };
    this.playback = new PlaybackService(planet, playbackResolvers);
    this.media = new MediaService(getSource);
    const identitySources: IdentitySourcePort = {
      active: () => {
        const provider = getSource();
        return {
          providerId: provider.providerId,
          diagnosticName: provider.name,
          identity: provider.identity,
        };
      },
    };
    const librarySources: UserLibrarySourcePort = {
      active: () => {
        const provider = getSource();
        return {
          providerId: provider.providerId,
          diagnosticName: provider.name,
          library: provider.userLibrary,
        };
      },
    };
    this.identity = new IdentityService(identitySources, credentials);
    this.library = new LibraryService(librarySources);
    this.engagement = new EngagementService(getSource);
    this.audio = new AudioAnalysisService(planet);
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
