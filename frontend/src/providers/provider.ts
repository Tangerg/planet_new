import { Plugin } from "@core";
import { MUSIC_PROVIDER } from "@core/plugin";
import { MusicProvider, ProviderCapability } from "@domain";
import { Playlist } from "@domain/model/playlist";
import { Lyric } from "@domain/model/lyric";
import { Album } from "@domain/model/album";
import { Artist } from "@domain/model/artist";
import { TrackPlayUrl } from "@domain/model/track";
import { Personalized } from "@domain/model/personalized";
import { SearchResult } from "@domain/model/search";
import { Chart } from "@domain/model/chart";

/**
 * Base class for data-source plugins. Every concrete music source
 * (NeteaseCloudMusic, Spotify, Mock, ...) extends Provider and publishes the
 * MUSIC_PROVIDER capability; several can be mounted at once (the ProviderRegistry
 * picks the active one). The plugin id is derived per source from `name`, so
 * their lifecycle entries stay distinct.
 */
export abstract class Provider extends Plugin implements MusicProvider {
  get id(): string {
    return `provider:${this.name}`;
  }

  protected onInit(): void {
    this.context.registry.provide(MUSIC_PROVIDER, this);
  }

  abstract get name(): string;

  abstract get capabilities(): ReadonlySet<ProviderCapability>;

  supports(cap: ProviderCapability): boolean {
    return this.capabilities.has(cap);
  }

  abstract playlistDetail(id: string): Promise<Playlist>;

  abstract lyric(id: string): Promise<Lyric[]>;

  abstract albumDetail(id: string): Promise<Album>;

  abstract artistDetail(id: string): Promise<Artist>;

  abstract playUrls(ids: string[]): Promise<TrackPlayUrl[]>;

  abstract personalized(): Promise<Personalized>;

  /* Optional capabilities: the base returns empty defaults; supporting
       providers override these and declare them in `capabilities`. */

  async search(_query: string): Promise<SearchResult> {
    return SearchResult.empty();
  }

  async toplists(): Promise<Chart[]> {
    return [];
  }

  async toplistDetail(_id: string): Promise<Playlist> {
    return { id: "", name: "", images: [], tracks: [], totalTracks: 0 };
  }
}
