import type { PlaybackAvailabilityPolicy } from "../model/playback-availability";
import type { ProviderId } from "../model/provider-id";
import type { TrackPlayUrl } from "../model/track";

/** Provider/SDK adapter seen by the playback application context. */
export interface PlaybackResolver {
  readonly providerId: ProviderId;
  readonly diagnosticName: string;
  readonly policy: PlaybackAvailabilityPolicy;
  resolve(playbackIds: string[]): Promise<TrackPlayUrl[]>;
}

export interface PlaybackResolverRegistry {
  active(): PlaybackResolver;
  get(providerId: ProviderId): PlaybackResolver | null;
}

/** Audible output command boundary. DOM Audio is one adapter, not the port. */
export interface AudioOutputPort {
  resume(): Promise<void>;
  pause(): void;
  stop(): void;
}
