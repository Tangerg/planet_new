import type { MusicProvider } from "@domain";
import type { Personalized } from "@domain/model/personalized";
import type { Playlist } from "@domain/model/playlist";
import type { Album } from "@domain/model/album";
import type { Artist } from "@domain/model/artist";
import type { Chart } from "@domain/model/chart";
import type { SearchResult } from "@domain/model/search";
import type { ProviderCapability } from "@domain";

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

  /* Lyrics are not a browse read — they follow the current track. The Lyric
     kernel plugin owns that (emits lyrics:changed); the UI reads it from the
     store. So no lyric() here on purpose. */

  /** All charts (list items, without tracks). */
  toplists(): Promise<Chart[]> {
    return this.getProvider().toplists();
  }

  /** Single chart detail (with tracks), reusing the Playlist shape. */
  toplistDetail(id: string): Promise<Playlist> {
    return this.getProvider().toplistDetail(id);
  }

  /** Keyword search; unsupported dimensions come back empty. */
  search(query: string): Promise<SearchResult> {
    return this.getProvider().search(query);
  }
}
