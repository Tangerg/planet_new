import * as Library from "@wailsjs/go/backend/Library";

import { Provider } from "../provider";
import {
  LocalLibraryLookupStatus,
  LocalLibraryUnavailableError,
  localLibraryCall,
} from "@contexts/local-library";
import type { CatalogPorts, LyricProvider, PlaybackAvailabilityPolicy, ProviderId } from "@domain";
import type { AlbumDetailSnapshot } from "@domain/model/album";
import type { ArtistDetailSnapshot } from "@domain/model/artist";
import { parseLyrics, type Lyric } from "@domain/model/lyric";
import type { Personalized } from "@domain/model/personalized";
import type { PlaylistDetailSnapshot } from "@domain/model/playlist";
import type { SearchResult } from "@domain/model/search";
import type { TrackPlayUrl, TrackSnapshot } from "@domain/model/track";
import { LOCAL_PROVIDER_ID, LOCAL_PROVIDER_NAME } from "./identity";
import { toAlbum, toArtist, toTrack } from "./mapper";

/** Synthetic playlist id for "every scanned track". */
const LIBRARY_ALL = "library:all";

/** The Go bridge is only present inside the Wails webview. Missing
 * infrastructure is reported explicitly rather than masquerading as empty data. */
function bridgeReady(): boolean {
  return typeof window !== "undefined" && "go" in window;
}

function requireBridge(): void {
  if (!bridgeReady()) throw new LocalLibraryUnavailableError();
}

/**
 * On-device music source. Scans folders and plays local files via the Go
 * `library` service (SQLite catalog + loopback media server) over the wailsjs
 * bridge. Catalog reads map the Go DTOs into domain entities; playback needs no
 * URL resolution because each track already carries its loopback `playUrl`.
 */
export class LocalMusic extends Provider {
  public static readonly ID = LOCAL_PROVIDER_ID;
  public static readonly NAME = LOCAL_PROVIDER_NAME;
  get name(): string {
    return LocalMusic.NAME;
  }

  get providerId(): ProviderId {
    return LocalMusic.ID;
  }

  protected get catalogPorts(): CatalogPorts {
    return {
      home: this,
      playlists: this,
      albums: this,
      artists: this,
      tracks: this,
      search: this,
      charts: null,
      musicVideos: null,
      artistMusicVideos: null,
    };
  }

  protected get playbackPolicy(): PlaybackAvailabilityPolicy {
    return { canResolveFullPlayback: true, canUsePreviewPlayback: false };
  }

  protected get lyricsPort(): LyricProvider {
    return this;
  }

  async personalized(): Promise<Personalized> {
    requireBridge();
    const home = await localLibraryCall(Library.Home());
    const totalTracks = home.albums.reduce((n, a) => n + a.trackCount, 0);
    return {
      playlists: totalTracks
        ? [
            {
              providerId: LOCAL_PROVIDER_ID,
              id: LIBRARY_ALL,
              name: "全部歌曲",
              images: [],
              totalTracks,
            },
          ]
        : [],
      albums: home.albums.map(toAlbum),
      artists: home.artists.map(toArtist),
      tracks: home.recentTracks.map(toTrack),
    };
  }

  async playlistDetail(id: string): Promise<PlaylistDetailSnapshot | undefined> {
    if (id !== LIBRARY_ALL) return undefined;
    requireBridge();
    const tracks = (await localLibraryCall(Library.AllTracks())).map(toTrack);
    return {
      providerId: LOCAL_PROVIDER_ID,
      id: LIBRARY_ALL,
      name: "全部歌曲",
      images: [],
      tracks,
      totalTracks: tracks.length,
    };
  }

  async albumDetail(id: string): Promise<AlbumDetailSnapshot | undefined> {
    requireBridge();
    const result = await localLibraryCall(Library.AlbumDetail(id));
    if (result.status === LocalLibraryLookupStatus.notFound) return undefined;
    if (result.status !== LocalLibraryLookupStatus.found) {
      throw new Error(`Unknown local-library album lookup status: ${result.status}`);
    }
    const detail = result.detail;
    return { ...toAlbum(detail.album), tracks: detail.tracks.map(toTrack) };
  }

  async artistDetail(id: string): Promise<ArtistDetailSnapshot | undefined> {
    requireBridge();
    const result = await localLibraryCall(Library.ArtistDetail(id));
    if (result.status === LocalLibraryLookupStatus.notFound) return undefined;
    if (result.status !== LocalLibraryLookupStatus.found) {
      throw new Error(`Unknown local-library artist lookup status: ${result.status}`);
    }
    const detail = result.detail;
    return {
      ...toArtist(detail.artist),
      topTracks: detail.tracks.map(toTrack),
      albums: detail.albums.map(toAlbum),
      similar: [],
    };
  }

  async trackDetails(ids: string[]): Promise<TrackSnapshot[]> {
    if (!ids.length) return [];
    requireBridge();
    return (await localLibraryCall(Library.Tracks(ids))).map(toTrack);
  }

  async trackDetail(id: string): Promise<TrackSnapshot | undefined> {
    return (await this.trackDetails([id]))[0];
  }

  async playUrls(playbackIds: string[]): Promise<TrackPlayUrl[]> {
    if (!playbackIds.length) return [];
    requireBridge();
    const tracks = await localLibraryCall(Library.Tracks(playbackIds));
    return tracks.filter((t) => t.playUrl).map((t) => ({ playbackId: t.id, playUrl: t.playUrl }));
  }

  async search(query: string): Promise<SearchResult> {
    if (!query.trim()) {
      return { tracks: [], artists: [], albums: [], playlists: [] };
    }
    requireBridge();
    const result = await localLibraryCall(Library.Search(query));
    return {
      tracks: result.tracks.map(toTrack),
      albums: result.albums.map(toAlbum),
      artists: result.artists.map(toArtist),
      playlists: [],
    };
  }

  /** Read the track's sidecar `.lrc` (next to the audio file) via the bridge and
   *  parse it into timed lines; empty when the track has no sidecar lyric. */
  async lyric(id: string): Promise<Lyric[]> {
    requireBridge();
    return parseLyrics(await localLibraryCall(Library.Lyric(id)));
  }
}
