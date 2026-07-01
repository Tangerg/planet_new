import { PlaybackAvailability, type PlaybackAvailabilityPolicy } from "./playback-availability";
import { Track, type TrackPlayUrl } from "./track";

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

  trackIdsToResolve(policy: PlaybackAvailabilityPolicy): string[] {
    return Track.uniqueIds(
      this.queue.filter((track) =>
        PlaybackAvailability.requiresFullUrlResolution(Track.playbackAvailability(track, policy)),
      ),
    );
  }

  withResolvedUrls(urls: readonly TrackPlayUrl[]): ResolvedPlaybackIntent {
    const queue = Track.withResolvedPlayUrls(this.queue, urls);
    return {
      tracks: queue,
      current: queue.find((track) => track.id === this.requested.id) ?? queue[0],
    };
  }
}

export type ResolvedPlaybackIntent = {
  tracks: readonly Track[];
  current: Track;
};
