import { definePlugin, type Task } from "dougong";
import { abandonOnAbort } from "@shared/async";
import type { Lyric } from "@domain/model/lyric";
import type { Track } from "@domain/model/track";
import { TrackKey, type TrackKey as TrackKeyValue } from "@domain/model/entity-key";
import { broadcaster, CURRENT_TRACK_CHANGED, LYRICS_CHANGED } from "../../kernel";
import { PROVIDER_REGISTRY, type ProviderRegistryPort } from "../provider-registry";

async function fetchLyrics(providers: ProviderRegistryPort, track: Track): Promise<Lyric[]> {
  const provider = providers.get(track.providerId);
  try {
    return provider?.lyrics ? await provider.lyrics.lyric(track.id) : [];
  } catch {
    // Provider lacks lyric support / fetch failed → empty (UI shows "no lyrics").
    return [];
  }
}

/**
 * Reactive lyric source. Follows the current track: on CURRENT_TRACK_CHANGED it
 * resolves the track's owning provider and fetches its lyrics, broadcasting
 * LYRICS_CHANGED. The UI reads the current lyrics from the store and never
 * fetches them — it doesn't even know which track's lyrics to ask for. This is
 * the "reactive business → kernel plugin" pattern (vs. on-demand browse reads,
 * which stay in MediaService + the UI's React Query cache).
 *
 * The fetch is a spawned Task rather than work awaited inside the listener, so
 * a newer track supersedes a slow one by disposing it — `Task.dispose()` aborts
 * synchronously, which is what makes the swap race-free — and stating the
 * current track never blocks on a lyric request.
 */
export const lyricsPlugin = definePlugin({
  name: "planet.lyrics",
  requires: { providers: PROVIDER_REGISTRY },
  setup(ctx) {
    const broadcast = broadcaster(ctx);
    /** Last source-qualified track fetched — skip only the same domain identity. */
    let lastTrackKey: TrackKeyValue | null | undefined;
    let inFlight: Task<void> | undefined;

    ctx.on(CURRENT_TRACK_CHANGED, (track) => {
      const key = track?.id ? TrackKey.of(track.providerId, track.id) : null;
      if (key === lastTrackKey) return;
      lastTrackKey = key;
      void inFlight?.dispose();

      if (!track || key === null) {
        inFlight = undefined;
        broadcast(LYRICS_CHANGED, []);
        return;
      }

      inFlight = ctx.spawn(async (signal) => {
        const lyrics = await abandonOnAbort(fetchLyrics(ctx.providers, track), signal);
        broadcast(LYRICS_CHANGED, lyrics);
      });
    });
  },
});
