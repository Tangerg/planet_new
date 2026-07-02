import type { KyInstance } from "ky";
import ky from "ky";

import { Provider } from "../provider";
import type {
  ProviderCapability,
  Account,
  AuthProvider,
  CredentialStore,
  LoginFlow,
  UserLibrary,
} from "@domain";
import type { Playlist } from "@domain/model/playlist";
import type { Track, TrackPlayUrl } from "@domain/model/track";
import type { Artist } from "@domain/model/artist";
import type { Lyric } from "@domain/model/lyric";
import type { Album } from "@domain/model/album";
import type { Comment } from "@domain/model/comment";
import type { MusicVideo } from "@domain/model/music-video";
import type { Personalized } from "@domain/model/personalized";
import type { SearchResult } from "@domain/model/search";
import { NCM_CAPABILITIES } from "./capabilities";
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

export class NeteaseCloudMusic extends Provider implements AuthProvider, UserLibrary {
  public static readonly NAME = "NeteaseCloudMusic";
  private static readonly CAPABILITIES = NCM_CAPABILITIES;

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
            const session = this.credentials?.get(this.name);
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

  get capabilities(): ReadonlySet<ProviderCapability> {
    return NeteaseCloudMusic.CAPABILITIES;
  }

  async playlistDetail(id: string): Promise<Playlist> {
    return fetchNcmPlaylistDetail(this.http, id);
  }

  async lyric(id: string): Promise<Lyric[]> {
    return fetchNcmLyrics(this.http, id);
  }

  async albumDetail(id: string): Promise<Album> {
    return fetchNcmAlbumDetail(this.http, id);
  }

  async artistDetail(id: string): Promise<Artist> {
    return fetchNcmArtistDetail(this.http, id);
  }

  async trackDetail(id: string): Promise<Partial<Track> | undefined> {
    const tracks = await this.trackDetails([id]);
    return tracks[0];
  }

  async trackDetails(ids: string[]): Promise<Partial<Track>[]> {
    return fetchNcmTrackDetails(this.http, ids);
  }

  async musicVideoDetail(id: string): Promise<MusicVideo | undefined> {
    return fetchNcmMusicVideoDetail(this.http, id);
  }

  async artistMusicVideos(artistId: string): Promise<Partial<MusicVideo>[]> {
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

  async toplistDetail(id: string): Promise<Playlist> {
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
    return beginNcmLogin(this.http, this.credentials, this.name);
  }

  async account(): Promise<Account> {
    const account = await fetchNcmAccount(this.http);
    if (account.id) this.uid = account.id;
    return account;
  }

  async logout(): Promise<void> {
    await logoutNcm(this.http, this.credentials, this.name);
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

  async playRecord(period: "week" | "all"): Promise<Partial<Track>[]> {
    return fetchNcmPlayRecord(this.http, await this.ensureUid(), period);
  }

  async dailyRecommendations(): Promise<Partial<Track>[]> {
    return fetchNcmDailyRecommendations(this.http);
  }
}
