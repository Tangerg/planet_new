import * as Library from "@wailsjs/go/backend/Library";

import { Provider } from "../provider";
import type { ProviderCapability } from "@domain";
import type { Album } from "@domain/model/album";
import type { Artist } from "@domain/model/artist";
import { parseLyrics, type Lyric } from "@domain/model/lyric";
import type { Personalized } from "@domain/model/personalized";
import type { Playlist } from "@domain/model/playlist";
import type { SearchResult } from "@domain/model/search";
import type { Track, TrackPlayUrl } from "@domain/model/track";
import { LOCAL_CAPABILITIES } from "./capabilities";
import { toAlbum, toArtist, toTrack } from "./mapper";

/** Synthetic playlist id for "every scanned track". */
const LIBRARY_ALL = "library:all";

/** The Go bridge is only present inside the Wails webview; guard so a plain
 *  browser dev session degrades to an empty library instead of throwing. */
function bridgeReady(): boolean {
  return typeof window !== "undefined" && "go" in window;
}

/**
 * On-device music source. Scans folders and plays local files via the Go
 * `library` service (SQLite catalog + loopback media server) over the wailsjs
 * bridge. Catalog reads map the Go DTOs into domain entities; playback needs no
 * URL resolution because each track already carries its loopback `playUrl`.
 */
export class LocalMusic extends Provider {
  public static readonly NAME = "Local";
  private static readonly CAPABILITIES = LOCAL_CAPABILITIES;

  get name(): string {
    return LocalMusic.NAME;
  }

  get capabilities(): ReadonlySet<ProviderCapability> {
    return LocalMusic.CAPABILITIES;
  }

  async personalized(): Promise<Personalized> {
    if (!bridgeReady()) return { playlists: [] };
    const home = await Library.Home();
    const totalTracks = home.albums.reduce((n, a) => n + a.trackCount, 0);
    return {
      playlists: totalTracks
        ? [{ id: LIBRARY_ALL, name: "全部歌曲", images: [], totalTracks }]
        : [],
      albums: home.albums.map(toAlbum),
      artists: home.artists.map(toArtist),
      tracks: home.recentTracks.map(toTrack),
    };
  }

  async playlistDetail(id: string): Promise<Playlist> {
    if (id !== LIBRARY_ALL || !bridgeReady()) {
      return { id, name: "", images: [], tracks: [], totalTracks: 0 };
    }
    const tracks = (await Library.AllTracks()).map(toTrack);
    return { id: LIBRARY_ALL, name: "全部歌曲", images: [], tracks, totalTracks: tracks.length };
  }

  async albumDetail(id: string): Promise<Album> {
    if (!bridgeReady()) return { id, name: "", images: [], artists: [] };
    const detail = await Library.AlbumDetail(id);
    if (!detail.album.id) return { id, name: "", images: [], artists: [] };
    return { ...toAlbum(detail.album), tracks: detail.tracks.map(toTrack) };
  }

  async artistDetail(id: string): Promise<Artist> {
    if (!bridgeReady()) return { id, name: "", images: [] };
    const detail = await Library.ArtistDetail(id);
    if (!detail.artist.id) return { id, name: "", images: [] };
    return {
      ...toArtist(detail.artist),
      topTracks: detail.tracks.map(toTrack),
      albums: detail.albums.map(toAlbum),
    };
  }

  async trackDetails(ids: string[]): Promise<Partial<Track>[]> {
    if (!ids.length || !bridgeReady()) return [];
    return (await Library.Tracks(ids)).map(toTrack);
  }

  async playUrls(playbackIds: string[]): Promise<TrackPlayUrl[]> {
    if (!playbackIds.length || !bridgeReady()) return [];
    const tracks = await Library.Tracks(playbackIds);
    return tracks.filter((t) => t.playUrl).map((t) => ({ playbackId: t.id, playUrl: t.playUrl }));
  }

  async search(query: string): Promise<SearchResult> {
    if (!query.trim() || !bridgeReady()) {
      return { tracks: [], artists: [], albums: [], playlists: [] };
    }
    const result = await Library.Search(query);
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
    if (!bridgeReady()) return [];
    return parseLyrics(await Library.Lyric(id));
  }
}
