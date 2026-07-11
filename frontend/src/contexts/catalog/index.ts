/** Catalog Context public API. */
export { MediaService } from "@core/application/MediaService";
export type { MusicVideoDiscoveryOptions } from "@core/application/MediaService";

export { Album } from "@domain/model/album";
export type {
  AlbumDetailSnapshot,
  AlbumReference,
  AlbumSnapshot,
  AlbumSummary,
} from "@domain/model/album";
export { Artist } from "@domain/model/artist";
export type {
  ArtistDetailSnapshot,
  ArtistLink,
  ArtistLookupReference,
  ArtistSnapshot,
  ArtistSummary,
} from "@domain/model/artist";
export type { ArtistCredit } from "@domain/model/artist-credit";
export type { Chart } from "@domain/model/chart";
export { pickImageUrl } from "@domain/model/image";
export type { Image } from "@domain/model/image";
export { MusicVideo } from "@domain/model/music-video";
export type {
  MusicVideoAvailabilityPolicy,
  MusicVideoDetailSnapshot,
  MusicVideoSnapshot,
  MusicVideoSummary,
} from "@domain/model/music-video";
export type { Personalized } from "@domain/model/personalized";
export { Playlist } from "@domain/model/playlist";
export type {
  PlaylistDetailSnapshot,
  PlaylistSnapshot,
  PlaylistSummary,
} from "@domain/model/playlist";
export { SearchResult } from "@domain/model/search";
export type { SearchResult as SearchResultSnapshot } from "@domain/model/search";
export { Track } from "@domain/model/track";
export type { TrackSnapshot } from "@domain/model/track";

export type {
  AlbumReader,
  ArtistMusicVideoReader,
  ArtistReader,
  CatalogAvailability,
  CatalogHomePort,
  CatalogPorts,
  CatalogSearchPort,
  CatalogSource,
  ChartReader,
  MusicVideoReader,
  PlaylistReader,
  TrackReader,
} from "@domain/ports/catalog";
