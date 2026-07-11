import type { AlbumDetailSnapshot } from "../model/album";
import type { ArtistDetailSnapshot } from "../model/artist";
import type { Chart } from "../model/chart";
import type { MusicVideoDetailSnapshot, MusicVideoSummary } from "../model/music-video";
import type { Personalized } from "../model/personalized";
import type { PlaylistDetailSnapshot } from "../model/playlist";
import type { SearchResult } from "../model/search";
import type { TrackSnapshot } from "../model/track";
import type { ProviderIdentity } from "./source";

export interface CatalogHomePort {
  personalized(): Promise<Personalized>;
}

export interface PlaylistReader {
  playlistDetail(id: string): Promise<PlaylistDetailSnapshot | undefined>;
}

export interface AlbumReader {
  albumDetail(id: string): Promise<AlbumDetailSnapshot | undefined>;
}

export interface ArtistReader {
  artistDetail(id: string): Promise<ArtistDetailSnapshot | undefined>;
}

export interface TrackReader {
  trackDetail(id: string): Promise<TrackSnapshot | undefined>;
  trackDetails(ids: string[]): Promise<TrackSnapshot[]>;
}

export interface CatalogSearchPort {
  search(query: string): Promise<SearchResult>;
}

export interface ChartReader {
  toplists(): Promise<Chart[]>;
  toplistDetail(id: string): Promise<PlaylistDetailSnapshot | undefined>;
}

export interface MusicVideoReader {
  musicVideoDetail(id: string): Promise<MusicVideoDetailSnapshot | undefined>;
}

export interface ArtistMusicVideoReader {
  artistMusicVideos(artistId: string): Promise<MusicVideoSummary[]>;
}

/** The Catalog adapter's actually registered ports. A null slot means the
 * source does not implement that port; no parallel capability string exists. */
export interface CatalogPorts {
  readonly home: CatalogHomePort | null;
  readonly playlists: PlaylistReader | null;
  readonly albums: AlbumReader | null;
  readonly artists: ArtistReader | null;
  readonly tracks: TrackReader | null;
  readonly search: CatalogSearchPort | null;
  readonly charts: ChartReader | null;
  readonly musicVideos: MusicVideoReader | null;
  readonly artistMusicVideos: ArtistMusicVideoReader | null;
}

/** UI-facing availability is a projection of CatalogPorts, never provider
 * metadata. It is kept as named booleans so views do not traffic in strings. */
export type CatalogAvailability = Readonly<{
  personalized: boolean;
  playlistDetail: boolean;
  albumDetail: boolean;
  artistDetail: boolean;
  trackDetail: boolean;
  search: boolean;
  toplist: boolean;
  musicVideoDetail: boolean;
  artistMusicVideos: boolean;
}>;

export interface CatalogSource extends ProviderIdentity {
  readonly catalog: CatalogPorts;
}
