import { Plugin } from "@core";
import { MUSIC_SOURCE } from "@core/plugin";
import type {
  CatalogPorts,
  EngagementPorts,
  IdentityGateway,
  LyricProvider,
  MusicSource,
  PlaybackAvailabilityPolicy,
  ProviderId,
  UserLibrary,
} from "@domain";
import type { TrackPlayUrl } from "@domain/model/track";

/**
 * Base lifecycle adapter for a music source. Concrete providers expose their
 * real context ports through catalogPorts/lyricsPort/identityPort/libraryPort.
 * A missing port is null; there is no parallel string capability declaration
 * and no empty optional method pretending that a port exists.
 */
export abstract class Provider extends Plugin {
  get id(): string {
    return `provider:${this.providerId}`;
  }

  protected onInit(): void {
    const source: MusicSource = {
      providerId: this.providerId,
      name: this.name,
      catalog: this.catalogPorts,
      playback: {
        providerId: this.providerId,
        diagnosticName: this.name,
        policy: this.playbackPolicy,
        resolve: (playbackIds) => this.playUrls(playbackIds),
      },
      lyrics: this.lyricsPort,
      identity: this.identityPort,
      userLibrary: this.libraryPort,
      engagement: this.engagementPorts,
    };
    this.context.registry.provide(MUSIC_SOURCE, source);
  }

  abstract get name(): string;

  abstract get providerId(): ProviderId;

  protected abstract get catalogPorts(): CatalogPorts;

  protected abstract get playbackPolicy(): PlaybackAvailabilityPolicy;

  protected get lyricsPort(): LyricProvider | null {
    return null;
  }

  protected get identityPort(): IdentityGateway | null {
    return null;
  }

  protected get libraryPort(): UserLibrary | null {
    return null;
  }

  protected get engagementPorts(): EngagementPorts {
    return {
      likes: null,
      playHistory: null,
      trackComments: null,
      musicVideoComments: null,
    };
  }

  /** Resolve provider-specific playback ids, which need not equal Track.id. */
  abstract playUrls(playbackIds: string[]): Promise<TrackPlayUrl[]>;
}
