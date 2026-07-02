import type { Playlist } from "../model/playlist";
import type { Lyric } from "../model/lyric";
import type { Album } from "../model/album";
import type { Artist } from "../model/artist";
import type { Track, TrackPlayUrl } from "../model/track";
import type { MusicVideo } from "../model/music-video";
import type { Personalized } from "../model/personalized";
import type { SearchResult } from "../model/search";
import type { Chart } from "../model/chart";
import type { Comment } from "../model/comment";

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
  | "trackDetail"
  | "musicVideoDetail"
  | "artistMusicVideos"
  | "musicVideoComments"
  | "lyric"
  | "personalized"
  | "search" // keyword search (tracks/artists/albums/playlists)
  | "toplist" // charts
  | "comments" // track comments (hot / recent)
  | "auth" // user login (verified by isAuthProvider)
  | "userLibrary" // logged-in user data: liked songs, playlists (verified by isUserLibraryProvider)
  | "fullPlayback" // can provide a full playable track URL
  | "previewPlayback"; // 30s preview clip only (e.g. Spotify preview_url)

export interface ProviderIdentity {
  get name(): string;

  /** Capabilities this provider supports. */
  get capabilities(): ReadonlySet<ProviderCapability>;

  supports(cap: ProviderCapability): boolean;
}

export interface PlaylistDetailProvider {
  /**
   * Playlist detail.
   * @param id playlist id
   */
  playlistDetail(id: string): Promise<Playlist>;
}

export interface LyricProvider {
  /**
   * Track lyrics.
   * @param id track id
   */
  lyric(id: string): Promise<Lyric[]>;
}

export interface AlbumDetailProvider {
  /**
   * Album detail.
   * @param id album id
   */
  albumDetail(id: string): Promise<Album>;
}

export interface ArtistDetailProvider {
  /**
   * Artist detail (basics + top tracks).
   * @param id artist id
   */
  artistDetail(id: string): Promise<Artist>;
}

export interface TrackDetailProvider {
  /**
   * Track detail.
   * @param id track id
   */
  trackDetail(id: string): Promise<Partial<Track> | undefined>;

  /**
   * Batch track detail. Preserves provider ordering when possible.
   * @param ids track ids
   */
  trackDetails(ids: string[]): Promise<Partial<Track>[]>;
}

export interface MusicVideoProvider {
  /**
   * Music video detail, including a playable URL when the provider supports it.
   * @param id music-video id
   */
  musicVideoDetail(id: string): Promise<MusicVideo | undefined>;

  /**
   * Music videos by an artist.
   * @param artistId artist id
   */
  artistMusicVideos(artistId: string): Promise<Partial<MusicVideo>[]>;

  /**
   * Comments for a music video.
   * @param musicVideoId music-video id
   */
  musicVideoComments(musicVideoId: string): Promise<Comment[]>;
}

export interface PlaybackUrlProvider {
  /**
   * Resolve playable URLs.
   * @param ids provider-specific playback ids, not necessarily `Track.id`
   */
  playUrls(playbackIds: string[]): Promise<TrackPlayUrl[]>;
}

export interface PersonalizedProvider {
  /**
   * Home / personalized data.
   */
  personalized(): Promise<Personalized>;
}

export interface SearchProvider {
  /**
   * Keyword search; unsupported dimensions return empty arrays.
   * @param query search keywords
   */
  search(query: string): Promise<SearchResult>;
}

export interface ToplistProvider {
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

export interface TrackCommentProvider {
  /**
   * Comments for a track (hot + recent); empty when unsupported.
   * @param trackId track id
   */
  comments(trackId: string): Promise<Comment[]>;
}

export interface MusicProvider
  extends
    ProviderIdentity,
    PlaylistDetailProvider,
    LyricProvider,
    AlbumDetailProvider,
    ArtistDetailProvider,
    TrackDetailProvider,
    MusicVideoProvider,
    PlaybackUrlProvider,
    PersonalizedProvider,
    SearchProvider,
    ToplistProvider,
    TrackCommentProvider {}
