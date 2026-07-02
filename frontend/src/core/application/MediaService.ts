import type { MusicProvider } from "@domain";
import type { Personalized } from "@domain/model/personalized";
import { Playlist } from "@domain/model/playlist";
import type { Album } from "@domain/model/album";
import { Artist, type ArtistReference } from "@domain/model/artist";
import type { Chart } from "@domain/model/chart";
import { SearchResult } from "@domain/model/search";
import type { Comment } from "@domain/model/comment";
import type { Track } from "@domain/model/track";
import { MusicVideo } from "@domain/model/music-video";
import type { MusicVideoAvailabilityPolicy } from "@domain/model/music-video";
import type { ProviderCapability } from "@domain";
import { warnReadFailure } from "@shared/debug";

export type MusicVideoDiscoveryOptions = {
  /** Maximum artist seeds to query. Defaults to a restrained discovery pass. */
  artistLimit?: number;
  /** Maximum unique videos to return after merging provider results. */
  videoLimit?: number;
};

const DEFAULT_MUSIC_VIDEO_DISCOVERY = {
  artistLimit: 6,
  videoLimit: 30,
} satisfies Required<MusicVideoDiscoveryOptions>;

/**
 * Application service for catalog / browse use cases — the single caller of the
 * provider for read data. The UI consumes this through its own cache transport
 * (React Query on the desktop shell) and never touches `MusicProvider`, so the view
 * holds no data-source reference and no fetch orchestration.
 *
 * Returns domain models; view-shape adaptation (→ VibeTrack etc.) stays in the
 * UI. Constructed with a provider getter (the active provider can change), it
 * never imports concrete `@providers` infrastructure or React.
 *
 * Dependency direction: core/application → domain (inner layer). Symmetric with
 * PlaybackService, which owns the command/playback use cases.
 */
export class MediaService {
  constructor(private readonly getProvider: () => MusicProvider) {}

  /** Active provider name — the UI folds this into its cache keys. */
  get providerName(): string {
    return this.getProvider().name;
  }

  /** Whether the active provider supports a capability (lyrics, search, …). */
  supports(cap: ProviderCapability): boolean {
    return this.getProvider().supports(cap);
  }

  /** Active provider's MV playback/detail resolution policy. */
  musicVideoPlaybackPolicy(): MusicVideoAvailabilityPolicy {
    return {
      canResolvePlayback: this.supports("musicVideoDetail"),
    };
  }

  /** Home / personalized catalog (playlists, albums, artists, tracks). */
  personalized(): Promise<Personalized> {
    return this.getProvider().personalized();
  }

  /** Playlist detail (with tracks). */
  playlistDetail(id: string): Promise<Playlist> {
    return this.getProvider().playlistDetail(id);
  }

  /** Album detail (with tracks). */
  albumDetail(id: string): Promise<Album> {
    return this.getProvider().albumDetail(id);
  }

  /** Artist detail (basics + top tracks). */
  artistDetail(id: string): Promise<Artist> {
    return this.getProvider().artistDetail(id);
  }

  /** Track detail. */
  trackDetail(id: string): Promise<Partial<Track> | undefined> {
    return this.readOptional("trackDetail", undefined, (provider) => provider.trackDetail(id));
  }

  /** Batch track detail. */
  trackDetails(ids: string[]): Promise<Partial<Track>[]> {
    if (!ids.length) return Promise.resolve([]);
    return this.readOptional("trackDetail", [], (provider) => provider.trackDetails(ids));
  }

  /** Music video detail, including playable URL when supported. */
  musicVideoDetail(id: string): Promise<MusicVideo | undefined> {
    return this.readOptional("musicVideoDetail", undefined, (provider) =>
      provider.musicVideoDetail(id),
    );
  }

  /** Music videos by an artist. */
  artistMusicVideos(artistId: string): Promise<Partial<MusicVideo>[]> {
    return this.readOptional("artistMusicVideos", [], (provider) =>
      provider.artistMusicVideos(artistId),
    );
  }

  /**
   * Discover music videos from a set of artist seeds. This is an application
   * use case, not a UI concern: it decides how many artist rails to query,
   * tolerates one provider request failing, and de-duplicates cross-artist
   * results before returning domain music videos.
   */
  async discoverArtistMusicVideos(
    artists: readonly ArtistReference[],
    options: MusicVideoDiscoveryOptions = {},
  ): Promise<Partial<MusicVideo>[]> {
    const provider = this.getProvider();
    if (!provider.supports("artistMusicVideos")) return [];

    const artistLimit = options.artistLimit ?? DEFAULT_MUSIC_VIDEO_DISCOVERY.artistLimit;
    const videoLimit = options.videoLimit ?? DEFAULT_MUSIC_VIDEO_DISCOVERY.videoLimit;
    const artistIds = Artist.uniqueIds(artists, Math.max(0, artistLimit));
    if (!artistIds.length || videoLimit <= 0) return [];

    const groups = await Promise.all(
      artistIds.map((id) =>
        provider.artistMusicVideos(id).catch((error: unknown) => {
          // Tolerate one seed failing (partial discovery still useful), but a
          // systematically failing endpoint stays visible in the console.
          warnReadFailure(`${provider.name}.artistMusicVideos(${id})`, error);
          return [];
        }),
      ),
    );
    return MusicVideo.uniqueById(groups.flat()).slice(0, videoLimit);
  }

  /** Comments for a music video. */
  musicVideoComments(musicVideoId: string): Promise<Comment[]> {
    return this.readOptional("musicVideoComments", [], (provider) =>
      provider.musicVideoComments(musicVideoId),
    );
  }

  /* Lyrics are not a browse read — they follow the current track. The Lyric
     kernel plugin owns that (emits lyrics:changed); the UI reads it from the
     store. So no lyric() here on purpose. */

  /** All charts (list items, without tracks). */
  toplists(): Promise<Chart[]> {
    return this.readOptional("toplist", [], (provider) => provider.toplists());
  }

  /** Single chart detail (with tracks), reusing the Playlist shape. */
  toplistDetail(id: string): Promise<Playlist> {
    return this.readOptional("toplist", Playlist.empty(id), (provider) =>
      provider.toplistDetail(id),
    );
  }

  /** Keyword search; unsupported dimensions come back empty. */
  search(query: string): Promise<SearchResult> {
    if (!query.trim()) return Promise.resolve(SearchResult.empty());
    return this.readOptional("search", SearchResult.empty(), (provider) => provider.search(query));
  }

  /** Comments for a track (hot + recent); empty when the provider has none. */
  comments(trackId: string): Promise<Comment[]> {
    return this.readOptional("comments", [], (provider) => provider.comments(trackId));
  }

  private async readOptional<T>(
    capability: ProviderCapability,
    fallback: T,
    read: (provider: MusicProvider) => Promise<T>,
  ): Promise<T> {
    const provider = this.getProvider();
    if (!provider.supports(capability)) return fallback;
    try {
      return await read(provider);
    } catch (error) {
      // A *supported* read that still failed is a real fault (endpoint down, bad
      // response), not "this provider can't do it". Surface it — a silent empty
      // return is indistinguishable from "no data" and hides broken wiring. We
      // still hand back the fallback so one bad read never blanks the whole app.
      warnReadFailure(`${provider.name}.${capability}`, error);
      return fallback;
    }
  }
}
