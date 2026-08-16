import type { Host } from "dougong";
import type {
  CredentialStore,
  IdentitySourcePort,
  MusicSource,
  PlaybackResolverRegistry,
  ProviderId,
} from "@domain";
import type { UserLibrarySourcePort } from "@domain/ports/user-library";
import { AUDIO_ANALYSER, PROVIDER_REGISTRY, type ProviderRegistryPort } from "../plugin";
import { AudioAnalysisService } from "./AudioAnalysisService";
import { EngagementService } from "./EngagementService";
import { IdentityService } from "./IdentityService";
import { LibraryService } from "./LibraryService";
import { MediaService } from "./MediaService";
import { PlaybackService } from "./PlaybackService";
import { SourceSelectionService } from "./SourceSelectionService";

/**
 * The application-facing facade over the kernel — the single handle the UI
 * holds. It hides the plugin host: the view issues commands/use-cases via
 * `playback` / `media`, lists/switches sources via `sources`, and reads
 * playback state from the zustand store the kernel bridge pins. It never
 * resolves plugins or reaches into the Host.
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
  readonly sources: SourceSelectionService;

  constructor(
    private readonly host: Host,
    credentials: CredentialStore,
  ) {
    this.sources = new SourceSelectionService(() => this.providerRegistry());
    const getSource = (): MusicSource => {
      const provider = this.providerRegistry().active;
      if (!provider) {
        throw new Error("No music provider is registered on the kernel.");
      }
      return provider;
    };
    const playbackResolvers: PlaybackResolverRegistry = {
      active: () => getSource().playback,
      get: (providerId: ProviderId) => {
        return this.providerRegistry().get(providerId)?.playback ?? null;
      },
    };
    this.playback = new PlaybackService(host, playbackResolvers);
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
    this.audio = new AudioAnalysisService(() => host.get(AUDIO_ANALYSER));
  }

  private providerRegistry(): ProviderRegistryPort {
    return this.host.get(PROVIDER_REGISTRY);
  }

  /** Stop the kernel (app teardown); every plugin's Lifetime is released. */
  dispose(): Promise<void> {
    return this.host.stop();
  }
}
