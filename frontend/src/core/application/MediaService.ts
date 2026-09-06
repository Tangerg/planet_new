import type { CatalogAvailability, CatalogSource, ProviderId } from "@domain";
import type { Personalized } from "@domain/model/personalized";
import type { PlaylistDetailSnapshot } from "@domain/model/playlist";
import type { AlbumDetailSnapshot } from "@domain/model/album";
import {
  Artist,
  type ArtistDetailSnapshot,
  type ArtistLookupReference,
} from "@domain/model/artist";
import type { Chart } from "@domain/model/chart";
import { SearchResult } from "@domain/model/search";
import type { TrackSnapshot } from "@domain/model/track";
import {
  MusicVideo,
  type MusicVideoAvailabilityPolicy,
  type MusicVideoDetailSnapshot,
  type MusicVideoSummary,
} from "@domain/model/music-video";
import { QueryFailedError, QueryResult, readPort, type QueryResult as Result } from "./QueryResult";

export type MusicVideoDiscoveryOptions = {
  artistLimit?: number;
  videoLimit?: number;
};

const DEFAULT_MUSIC_VIDEO_DISCOVERY = {
  artistLimit: 6,
  videoLimit: 30,
} satisfies Required<MusicVideoDiscoveryOptions>;

/** Catalog query use cases. Every query returns explicit application state:
 * successful empty data, unsupported, not-found and failed are distinct. */
export class MediaService {
  constructor(private readonly getProvider: () => CatalogSource) {}

  get providerId(): ProviderId {
    return this.getProvider().providerId;
  }

  /** UI availability is derived from registered ports, never metadata. */
  get availability(): CatalogAvailability {
    const ports = this.getProvider().catalog;
    return {
      personalized: ports.home !== null,
      playlistDetail: ports.playlists !== null,
      albumDetail: ports.albums !== null,
      artistDetail: ports.artists !== null,
      trackDetail: ports.tracks !== null,
      search: ports.search !== null,
      toplist: ports.charts !== null,
      musicVideoDetail: ports.musicVideos !== null,
      artistMusicVideos: ports.artistMusicVideos !== null,
    };
  }

  musicVideoPlaybackPolicy(): MusicVideoAvailabilityPolicy {
    return { canResolvePlayback: this.availability.musicVideoDetail };
  }

  personalized(): Promise<Result<Personalized>> {
    const source = this.getProvider();
    return this.read(source, source.catalog.home, "personalized", (port) => port.personalized());
  }

  playlistDetail(id: string): Promise<Result<PlaylistDetailSnapshot>> {
    const source = this.getProvider();
    return this.read(source, source.catalog.playlists, "playlistDetail", (port) =>
      port.playlistDetail(id),
    );
  }

  albumDetail(id: string): Promise<Result<AlbumDetailSnapshot>> {
    const source = this.getProvider();
    return this.read(source, source.catalog.albums, "albumDetail", (port) => port.albumDetail(id));
  }

  artistDetail(id: string): Promise<Result<ArtistDetailSnapshot>> {
    const source = this.getProvider();
    return this.read(source, source.catalog.artists, "artistDetail", (port) =>
      port.artistDetail(id),
    );
  }

  trackDetail(id: string): Promise<Result<TrackSnapshot>> {
    const source = this.getProvider();
    return this.read(source, source.catalog.tracks, "trackDetail", (port) => port.trackDetail(id));
  }

  trackDetails(ids: string[]): Promise<Result<TrackSnapshot[]>> {
    if (!ids.length) return Promise.resolve(QueryResult.success([]));
    const source = this.getProvider();
    return this.read(source, source.catalog.tracks, "trackDetails", (port) =>
      port.trackDetails(ids),
    );
  }

  musicVideoDetail(id: string): Promise<Result<MusicVideoDetailSnapshot>> {
    const source = this.getProvider();
    return this.read(source, source.catalog.musicVideos, "musicVideoDetail", (port) =>
      port.musicVideoDetail(id),
    );
  }

  artistMusicVideos(artistId: string): Promise<Result<MusicVideoSummary[]>> {
    const source = this.getProvider();
    return this.read(source, source.catalog.artistMusicVideos, "artistMusicVideos", (port) =>
      port.artistMusicVideos(artistId),
    );
  }

  async discoverArtistMusicVideos(
    artists: readonly ArtistLookupReference[],
    options: MusicVideoDiscoveryOptions = {},
  ): Promise<Result<MusicVideoSummary[]>> {
    const source = this.getProvider();
    const port = source.catalog.artistMusicVideos;
    if (!port) return QueryResult.unsupported();

    const artistLimit = options.artistLimit ?? DEFAULT_MUSIC_VIDEO_DISCOVERY.artistLimit;
    const videoLimit = options.videoLimit ?? DEFAULT_MUSIC_VIDEO_DISCOVERY.videoLimit;
    const artistIds = Artist.uniqueIds(artists, Math.max(0, artistLimit));
    if (!artistIds.length || videoLimit <= 0) return QueryResult.success([]);

    const attempts = await Promise.all(
      artistIds.map(async (id) => {
        try {
          return { data: await port.artistMusicVideos(id), error: null };
        } catch (cause) {
          return {
            data: [] as MusicVideoSummary[],
            error: new QueryFailedError(source.name, `artistMusicVideos(${id})`, { cause }),
          };
        }
      }),
    );
    const errors = attempts.flatMap(({ error }) => (error ? [error] : []));
    if (errors.length === attempts.length) return QueryResult.failed(errors[0]);

    const data = MusicVideo.uniqueById(attempts.flatMap(({ data }) => data)).slice(0, videoLimit);
    return errors.length ? QueryResult.partial(data, errors) : QueryResult.success(data);
  }

  toplists(): Promise<Result<Chart[]>> {
    const source = this.getProvider();
    return this.read(source, source.catalog.charts, "toplists", (port) => port.toplists());
  }

  toplistDetail(id: string): Promise<Result<PlaylistDetailSnapshot>> {
    const source = this.getProvider();
    return this.read(source, source.catalog.charts, "toplistDetail", (port) =>
      port.toplistDetail(id),
    );
  }

  search(query: string): Promise<Result<SearchResult>> {
    if (!query.trim()) return Promise.resolve(QueryResult.success(SearchResult.empty()));
    const source = this.getProvider();
    return this.read(source, source.catalog.search, "search", (port) => port.search(query));
  }

  private read<Port, T>(
    source: CatalogSource,
    port: Port | null,
    operation: string,
    read: (port: Port) => Promise<T | undefined>,
  ): Promise<Result<T>> {
    return readPort(port, { source: source.name, operation }, read);
  }
}
