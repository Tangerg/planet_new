import { PlaybackAvailability, type PlaybackAvailabilityPolicy } from "./playback-availability";
import { Track, type ProviderTrackPlayUrls } from "./track";
import { TrackKey } from "./entity-key";
import type { ProviderId } from "./provider-id";

/**
 * A user's intent to start playback from a list. It is pure domain state:
 * no provider, no audio element, no kernel plugin. The application layer can
 * ask it which URLs to resolve, then apply the resolved URLs back immutably.
 */
export class PlaybackIntent {
  private constructor(
    private readonly queue: readonly Track[],
    private readonly requested: Track,
  ) {}

  static from(tracks: readonly Track[], requested: Track): PlaybackIntent {
    const queue = tracks.length ? [...tracks] : [requested];
    return new PlaybackIntent(queue, requested);
  }

  get tracks(): readonly Track[] {
    return this.queue;
  }

  get requestedTrack(): Track {
    return this.requested;
  }

  get trackIds(): string[] {
    return Track.uniqueIds(this.queue);
  }

  get playbackIds(): string[] {
    return Track.uniquePlaybackIds(this.queue);
  }

  get providerIds(): ProviderId[] {
    return [...new Set(this.queue.map((track) => track.providerId))];
  }

  tracksFor(providerId: ProviderId): readonly Track[] {
    return this.queue.filter((track) => track.providerId === providerId);
  }

  playbackIdsToResolve(providerId: ProviderId, policy: PlaybackAvailabilityPolicy): string[] {
    return Track.uniquePlaybackIds(
      this.queue.filter(
        (track) =>
          track.providerId === providerId &&
          PlaybackAvailability.requiresFullUrlResolution(Track.playbackAvailability(track, policy)),
      ),
    );
  }

  withResolvedUrls(resolutions: readonly ProviderTrackPlayUrls[]): ResolvedPlaybackIntent {
    const queue = Track.withResolvedPlayUrls(this.queue, resolutions);
    const requestedKey = TrackKey.of(this.requested.providerId, this.requested.id);
    return {
      tracks: queue,
      current:
        queue.find((track) => TrackKey.of(track.providerId, track.id) === requestedKey) ?? queue[0],
    };
  }
}

export type ResolvedPlaybackIntent = {
  tracks: readonly Track[];
  current: Track;
};
