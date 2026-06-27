import { Plugin } from "@core";
import { IProvider, PROVIDER_PLUGIN_ID, ProviderCapability } from "@domain";
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
 * (NeteaseCloudMusic, Spotify, Mock, ...) registers with the planet by
 * extending Provider. Exactly one provider is mounted at a time, so they share
 * a fixed plugin id (PLUGIN_ID); concrete providers differ by `name` and `capabilities`.
 */
export abstract class Provider extends Plugin implements IProvider {
  public static readonly PLUGIN_ID = PROVIDER_PLUGIN_ID;

  get id(): string {
    return Provider.PLUGIN_ID;
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
    return { tracks: [], artists: [], albums: [], playlists: [] };
  }

  async toplists(): Promise<Chart[]> {
    return [];
  }

  async toplistDetail(_id: string): Promise<Playlist> {
    return { id: "", name: "", images: [], tracks: [], totalTracks: 0 };
  }
}
