import { definePlugin } from "dougong";
import type { Lyric } from "@domain/model/lyric";
import type { Track } from "@domain/model/track";
import { TrackKey, type TrackKey as TrackKeyValue } from "@domain/model/entity-key";
import { broadcaster, CURRENT_TRACK_CHANGED, LYRICS_CHANGED, type Broadcast } from "../../kernel";
import { PROVIDER_REGISTRY, type ProviderRegistryPort } from "../provider-registry";

/**
 * Reactive lyric source. Follows the current track: on CURRENT_TRACK_CHANGED it
 * resolves the track's owning provider and fetches its lyrics, broadcasting
 * LYRICS_CHANGED. The UI reads the current lyrics from the store and never
 * fetches them — it doesn't even know which track's lyrics to ask for. This is
 * the "reactive business → kernel plugin" pattern (vs. on-demand browse reads,
 * which stay in MediaService + the UI's React Query cache).
 */
class LyricsFollower {
  /** Last source-qualified track fetched — skip only the same domain identity. */
  private lastTrackKey: TrackKeyValue | null | undefined;
  /** Generation guard: a newer track supersedes a slow in-flight lyric fetch. */
  private generation = 0;

  constructor(
    private readonly providers: ProviderRegistryPort,
    private readonly broadcast: Broadcast,
  ) {}

  readonly follow = async (track: Track | undefined): Promise<void> => {
    const key = track?.id ? TrackKey.of(track.providerId, track.id) : null;
    if (key === this.lastTrackKey) return;
    this.lastTrackKey = key;
    const gen = ++this.generation;

    if (!track || key === null) {
      this.broadcast(LYRICS_CHANGED, []);
      return;
    }

    const provider = this.providers.get(track.providerId);
    let lyrics: Lyric[] = [];
    try {
      lyrics = provider?.lyrics ? await provider.lyrics.lyric(track.id) : [];
    } catch {
      // Provider lacks lyric support / fetch failed → emit empty (UI shows "no lyrics").
      lyrics = [];
    }

    // Stale guard: a newer track changed since this fetch began — drop the result.
    if (gen !== this.generation) return;
    this.broadcast(LYRICS_CHANGED, lyrics);
  };
}

export const lyricsPlugin = definePlugin({
  name: "planet.lyrics",
  requires: { providers: PROVIDER_REGISTRY },
  setup(ctx) {
    const follower = new LyricsFollower(ctx.providers, broadcaster(ctx));
    ctx.on(CURRENT_TRACK_CHANGED, follower.follow);
  },
});
