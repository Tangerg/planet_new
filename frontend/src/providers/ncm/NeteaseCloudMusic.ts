import type { KyInstance } from "ky";
import ky from "ky";

import { Provider } from "../provider";
import {
  type CatalogPorts,
  type Account,
  type CredentialStore,
  type EngagementPorts,
  type IdentityGateway,
  type LoginFlow,
  type LyricProvider,
  type PlaybackAvailabilityPolicy,
  type ProviderId,
  type UserLibrary,
} from "@domain";
import type { Playlist, PlaylistDetailSnapshot } from "@domain/model/playlist";
import type { TrackPlayUrl, TrackSnapshot } from "@domain/model/track";
import type { ArtistDetailSnapshot } from "@domain/model/artist";
import type { Lyric } from "@domain/model/lyric";
import type { AlbumDetailSnapshot } from "@domain/model/album";
import type { Comment } from "@domain/model/comment";
import type { MusicVideoDetailSnapshot, MusicVideoSummary } from "@domain/model/music-video";
import type { Personalized } from "@domain/model/personalized";
import type { SearchResult } from "@domain/model/search";
import { NCM_PROVIDER_ID, NCM_PROVIDER_NAME } from "./identity";
import { beginNcmLogin, fetchNcmAccount, fetchNcmUid, logoutNcm } from "./account";
import { fetchNcmPersonalized, fetchNcmToplists } from "./catalog";
import { fetchNcmMusicVideoComments, fetchNcmTrackComments } from "./comments";
import { fetchNcmAlbumDetail, fetchNcmArtistDetail, fetchNcmPlaylistDetail } from "./details";
import {
  fetchNcmDailyRecommendations,
  fetchNcmLikedTrackIds,
  fetchNcmPlayRecord,
  fetchNcmUserPlaylists,
  setNcmLiked,
} from "./library";
import { fetchNcmArtistMusicVideos, fetchNcmMusicVideoDetail } from "./music-videos";
import { searchNcm } from "./search";
import { fetchNcmLyrics, fetchNcmPlayUrls, fetchNcmTrackDetails } from "./tracks";

export type Options = {
  host: string;
  /** Persists the session cookie; injected so login survives restarts. */
  credentials?: CredentialStore;
};

export class NeteaseCloudMusic extends Provider implements IdentityGateway, UserLibrary {
  public static readonly ID = NCM_PROVIDER_ID;
  public static readonly NAME = NCM_PROVIDER_NAME;
  private readonly http: KyInstance;
  private readonly credentials?: CredentialStore;
  /** Cached logged-in user id (uid), needed by likelist / user playlists. */
  private uid?: string;

  constructor(opts: Options) {
    super();
    this.credentials = opts.credentials;
    this.http = ky.create({
      prefix: opts.host,
      timeout: 10_000,
      hooks: {
        // Attach the stored session cookie (when logged in) to every request;
        // NeteaseCloudMusicApi reads it from the `cookie` query param.
        beforeRequest: [
          ({ request }) => {
            const session = this.credentials?.get(this.providerId);
            if (!session) return;
            const url = new URL(request.url);
            if (!url.searchParams.has("cookie")) {
              url.searchParams.set("cookie", session.token);
              return new Request(url, request);
            }
          },
        ],
      },
    });
  }

  get name(): string {
    return NeteaseCloudMusic.NAME;
  }

  get providerId(): ProviderId {
    return NeteaseCloudMusic.ID;
  }

  protected get catalogPorts(): CatalogPorts {
    return {
      home: this,
      playlists: this,
      albums: this,
      artists: this,
      tracks: this,
      search: this,
      charts: this,
      musicVideos: this,
      artistMusicVideos: this,
    };
  }

  protected get playbackPolicy(): PlaybackAvailabilityPolicy {
    return { canResolveFullPlayback: true, canUsePreviewPlayback: false };
  }

  protected get lyricsPort(): LyricProvider {
    return this;
  }

  protected get identityPort(): IdentityGateway {
    return this;
  }

  protected get libraryPort(): UserLibrary {
    return this;
  }

  protected get engagementPorts(): EngagementPorts {
    return {
      likes: this,
      playHistory: this,
      trackComments: this,
      musicVideoComments: this,
    };
  }

  async playlistDetail(id: string): Promise<PlaylistDetailSnapshot | undefined> {
    return fetchNcmPlaylistDetail(this.http, id);
  }

  async lyric(id: string): Promise<Lyric[]> {
    return fetchNcmLyrics(this.http, id);
  }

  async albumDetail(id: string): Promise<AlbumDetailSnapshot | undefined> {
    return fetchNcmAlbumDetail(this.http, id);
  }

  async artistDetail(id: string): Promise<ArtistDetailSnapshot | undefined> {
    return fetchNcmArtistDetail(this.http, id);
  }

  async trackDetail(id: string): Promise<TrackSnapshot | undefined> {
    const tracks = await this.trackDetails([id]);
    return tracks[0];
  }

  async trackDetails(ids: string[]): Promise<TrackSnapshot[]> {
    return fetchNcmTrackDetails(this.http, ids);
  }

  async musicVideoDetail(id: string): Promise<MusicVideoDetailSnapshot | undefined> {
    return fetchNcmMusicVideoDetail(this.http, id);
  }

  async artistMusicVideos(artistId: string): Promise<MusicVideoSummary[]> {
    return fetchNcmArtistMusicVideos(this.http, artistId);
  }

  async playUrls(playbackIds: string[]): Promise<TrackPlayUrl[]> {
    return fetchNcmPlayUrls(this.http, playbackIds);
  }

  async personalized(): Promise<Personalized> {
    return fetchNcmPersonalized(this.http);
  }

  async search(query: string): Promise<SearchResult> {
    return searchNcm(this.http, query);
  }

  async toplists() {
    return fetchNcmToplists(this.http);
  }

  async toplistDetail(id: string): Promise<PlaylistDetailSnapshot | undefined> {
    // A chart is a playlist on NCM, so its detail goes through the same endpoint.
    return this.playlistDetail(id);
  }

  async comments(trackId: string): Promise<Comment[]> {
    return fetchNcmTrackComments(this.http, trackId);
  }

  async musicVideoComments(musicVideoId: string): Promise<Comment[]> {
    return fetchNcmMusicVideoComments(this.http, musicVideoId);
  }

  // ── Auth (QR login: scan with the NCM mobile app) ──────────────────────────

  async beginLogin(): Promise<LoginFlow> {
    return beginNcmLogin(this.http, this.credentials, this.providerId);
  }

  async account(): Promise<Account | undefined> {
    const account = await fetchNcmAccount(this.http);
    if (account?.id) this.uid = account.id;
    return account;
  }

  async logout(): Promise<void> {
    await logoutNcm(this.http);
    this.uid = undefined;
  }

  // ── User library (requires login) ──────────────────────────────────────────

  /** likelist / user-playlist / record endpoints need the uid; resolve it once
   *  per session. Uses the lightweight /user/account (not the enriched account(),
   *  which also fetches follower counts) so id-only callers stay cheap. */
  private async ensureUid(): Promise<string> {
    if (this.uid) return this.uid;
    this.uid = await fetchNcmUid(this.http);
    return this.uid;
  }

  async likedTrackIds(): Promise<string[]> {
    return fetchNcmLikedTrackIds(this.http, await this.ensureUid());
  }

  async setLiked(trackId: string, liked: boolean): Promise<void> {
    await setNcmLiked(this.http, trackId, liked);
  }

  async userPlaylists(): Promise<Playlist[]> {
    return fetchNcmUserPlaylists(this.http, await this.ensureUid());
  }

  async playRecord(period: "week" | "all"): Promise<TrackSnapshot[]> {
    return fetchNcmPlayRecord(this.http, await this.ensureUid(), period);
  }

  async dailyRecommendations(): Promise<TrackSnapshot[]> {
    return fetchNcmDailyRecommendations(this.http);
  }
}
