import { Playlist } from "../model/playlist";
import { Lyric } from "../model/lyric";
import { Album } from "../model/album";
import { Artist } from "../model/artist";
import { TrackPlayUrl } from "../model/track";
import { Personalized } from "../model/personalized";
import { SearchResult } from "../model/search";
import { Chart } from "../model/chart";

/**
 * Provider capability declaration. What each source can do is expressed by its
 * `capabilities` set; the UI uses it to decide whether to show the lyrics panel,
 * surface a "30s preview only" hint, and so on.
 *
 * Methods for unsupported capabilities return empty values (lyric -> [], playUrls
 * -> []) rather than throwing, so callers need no scattered if/try.
 */
export type ProviderCapability =
  | "playlistDetail"
  | "albumDetail"
  | "artistDetail"
  | "lyric"
  | "personalized"
  | "search" // keyword search (tracks/artists/albums/playlists)
  | "toplist" // charts
  | "fullPlayback" // can provide a full playable track URL
  | "previewPlayback"; // 30s preview clip only (e.g. Spotify preview_url)

export interface IProvider {
  get name(): string;

  /** Capabilities this provider supports. */
  get capabilities(): ReadonlySet<ProviderCapability>;

  supports(cap: ProviderCapability): boolean;

  /**
   * Playlist detail.
   * @param id playlist id
   */
  playlistDetail(id: string): Promise<Playlist>;

  /**
   * Track lyrics.
   * @param id track id
   */
  lyric(id: string): Promise<Lyric[]>;

  /**
   * Album detail.
   * @param id album id
   */
  albumDetail(id: string): Promise<Album>;

  /**
   * Artist detail (basics + top tracks).
   * @param id artist id
   */
  artistDetail(id: string): Promise<Artist>;

  /**
   * Resolve playable URLs.
   * @param ids track ids
   */
  playUrls(ids: string[]): Promise<TrackPlayUrl[]>;

  /**
   * Home / personalized data.
   */
  personalized(): Promise<Personalized>;

  /**
   * Keyword search; unsupported dimensions return empty arrays.
   * @param query search keywords
   */
  search(query: string): Promise<SearchResult>;

  /**
   * All charts (list items, without tracks).
   */
  toplists(): Promise<Chart[]>;

  /**
   * Single chart detail (with tracks), reusing the Playlist shape.
   * @param id chart id
   */
  toplistDetail(id: string): Promise<Playlist>;
}

/**
 * Well-known kernel plugin id under which the active provider is registered.
 * Exactly one provider is mounted at a time, so the id is fixed. Lives in the
 * domain so the UI can resolve the provider through its port without importing
 * the concrete `@providers` infrastructure.
 */
export const PROVIDER_PLUGIN_ID = "provider";
