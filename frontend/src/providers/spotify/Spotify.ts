import type { KyInstance } from "ky";
import ky from "ky";

import { Provider } from "../provider";
import type { CatalogPorts, PlaybackAvailabilityPolicy, ProviderId } from "@domain";
import type { PlaylistDetailSnapshot, PlaylistSnapshot } from "@domain/model/playlist";
import type { TrackPlayUrl } from "@domain/model/track";
import type { ArtistDetailSnapshot, ArtistLink, ArtistSnapshot } from "@domain/model/artist";
import type { AlbumDetailSnapshot, AlbumSnapshot } from "@domain/model/album";
import type { Personalized } from "@domain/model/personalized";
import { toImages, toTrack } from "./mapper";
import type {
  SpotifyImage,
  SpotifyPaging,
  SpotifySimplifiedAlbum,
  SpotifySimplifiedArtist,
  SpotifyTrack,
} from "./types";
import { SPOTIFY_PROVIDER_ID, SPOTIFY_PROVIDER_NAME } from "./identity";

/**
 * Spotify Web API provider.
 *
 * Limitations (vs NeteaseCloudMusic):
 *   - No full playback URL: each track has at most a 30s `preview_url`, and many
 *     are null. Full playback needs Spotify Premium + the Web Playback SDK,
 *     which this provider does not implement.
 *   - No lyrics: the Web API has no lyric endpoint, so no lyric port is registered.
 *   - Recommendations via Client Credentials: new-releases / search are stitched
 *     into playlists + albums + artists; featured-playlists is unavailable to
 *     apps created after 2024-11, so we do not rely on it.
 */

export type SpotifyOptions = {
  clientId: string;
  clientSecret: string;
  /** Defaults to https://accounts.spotify.com */
  accountsHost?: string;
  /** Defaults to https://api.spotify.com */
  apiHost?: string;
  /** Market filter, e.g. "US" / "JP" (optional). */
  market?: string;
  /** Optional concrete clients for deterministic adapter tests. */
  accounts?: KyInstance;
  api?: KyInstance;
};

export class Spotify extends Provider {
  public static readonly ID = SPOTIFY_PROVIDER_ID;
  public static readonly NAME = SPOTIFY_PROVIDER_NAME;
  private readonly opts: Required<Omit<SpotifyOptions, "market" | "accounts" | "api">> &
    Pick<SpotifyOptions, "market">;
  private readonly accounts: KyInstance;
  private readonly api: KyInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;
  private inflightToken: Promise<string> | null = null;

  constructor(opts: SpotifyOptions) {
    super();
    this.opts = {
      clientId: opts.clientId,
      clientSecret: opts.clientSecret,
      accountsHost: opts.accountsHost ?? "https://accounts.spotify.com",
      apiHost: opts.apiHost ?? "https://api.spotify.com",
      market: opts.market,
    };
    this.accounts = opts.accounts ?? ky.create({ prefix: this.opts.accountsHost });
    this.api =
      opts.api ??
      ky.create({
        prefix: `${this.opts.apiHost}/v1`,
        hooks: {
          beforeRequest: [
            async ({ request }) => {
              const token = await this.ensureToken();
              request.headers.set("Authorization", `Bearer ${token}`);
            },
          ],
        },
        retry: { limit: 1, statusCodes: [401] },
      });
  }

  get name(): string {
    return Spotify.NAME;
  }

  get providerId(): ProviderId {
    return Spotify.ID;
  }

  protected get catalogPorts(): CatalogPorts {
    return {
      home: this,
      playlists: this,
      albums: this,
      artists: this,
      tracks: null,
      search: null,
      charts: null,
      musicVideos: null,
      artistMusicVideos: null,
    };
  }

  protected get playbackPolicy(): PlaybackAvailabilityPolicy {
    return { canResolveFullPlayback: false, canUsePreviewPlayback: true };
  }

  private async ensureToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }
    if (this.inflightToken) return this.inflightToken;

    this.inflightToken = (async () => {
      const basic = btoa(`${this.opts.clientId}:${this.opts.clientSecret}`);
      const res = await this.accounts
        .post("api/token", {
          headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "grant_type=client_credentials",
        })
        .json<{ access_token: string; expires_in: number }>();
      this.accessToken = res.access_token;
      // Expire 30s early so a boundary request never carries a stale token.
      this.tokenExpiresAt = Date.now() + (res.expires_in - 30) * 1000;
      return this.accessToken;
    })();

    try {
      return await this.inflightToken;
    } finally {
      this.inflightToken = null;
    }
  }

  private withMarket(params: Record<string, string>): Record<string, string> {
    return this.opts.market ? { ...params, market: this.opts.market } : params;
  }

  async playlistDetail(id: string): Promise<PlaylistDetailSnapshot | undefined> {
    const res = await this.api.get(`playlists/${id}`, { searchParams: this.withMarket({}) }).json<{
      id: string;
      name: string;
      description: string | null;
      images: SpotifyImage[];
      owner: { id: string; display_name: string | null };
      tracks: SpotifyPaging<{ track: SpotifyTrack | null }>;
    }>();

    const items = (res.tracks.items ?? [])
      .map((it) => it.track)
      .filter((t): t is SpotifyTrack => !!t);

    const tracks = items.map((t, i) => toTrack(t, undefined, i + 1));

    return {
      providerId: SPOTIFY_PROVIDER_ID,
      id: res.id,
      name: res.name,
      description: res.description ?? "",
      images: toImages(res.images),
      totalTracks: res.tracks.total ?? tracks.length,
      owner: {
        id: res.owner.id,
        displayName: res.owner.display_name ?? res.owner.id,
      },
      tracks,
    };
  }

  async albumDetail(id: string): Promise<AlbumDetailSnapshot | undefined> {
    const res = await this.api.get(`albums/${id}`, { searchParams: this.withMarket({}) }).json<{
      id: string;
      name: string;
      release_date: string;
      images: SpotifyImage[];
      artists: SpotifySimplifiedArtist[];
      total_tracks: number;
      tracks: SpotifyPaging<SpotifyTrack>;
    }>();

    const albumStub: SpotifySimplifiedAlbum = {
      id: res.id,
      name: res.name,
      images: res.images,
    };
    const tracks = (res.tracks.items ?? []).map((t, i) => toTrack(t, albumStub, i + 1));

    return {
      providerId: SPOTIFY_PROVIDER_ID,
      id: res.id,
      name: res.name,
      alias: [],
      images: toImages(res.images),
      totalTracks: res.total_tracks,
      releaseDate: res.release_date,
      tracks,
      artists: res.artists.map(
        (a): ArtistLink => ({ providerId: SPOTIFY_PROVIDER_ID, id: a.id, name: a.name }),
      ),
    };
  }

  async artistDetail(id: string): Promise<ArtistDetailSnapshot | undefined> {
    type ArtistInfo = {
      id: string;
      name: string;
      images: SpotifyImage[];
      genres?: string[];
      followers?: { total?: number };
    };
    type TopTracksRes = { tracks?: SpotifyTrack[] };
    // /artists/{id} for basics; /artists/{id}/top-tracks for top tracks.
    const [info, top] = await Promise.all([
      this.api.get(`artists/${id}`).json<ArtistInfo>(),
      this.api
        .get(`artists/${id}/top-tracks`, {
          searchParams: this.withMarket({}),
        })
        .json<TopTracksRes>()
        .catch(() => ({ tracks: [] }) as TopTracksRes),
    ]);

    const topTracks = (top.tracks ?? []).slice(0, 10).map((t, i) => toTrack(t, undefined, i + 1));

    return {
      providerId: SPOTIFY_PROVIDER_ID,
      id: info.id,
      name: info.name,
      images: toImages(info.images),
      banner: info.images?.[0]?.url,
      genres: info.genres ?? [],
      followers: info.followers?.total,
      topTracks,
      albums: [],
      similar: [],
    };
  }

  async playUrls(playbackIds: string[]): Promise<TrackPlayUrl[]> {
    if (playbackIds.length === 0) return [];
    const out: TrackPlayUrl[] = [];
    // /tracks accepts at most 50 ids per call.
    for (let i = 0; i < playbackIds.length; i += 50) {
      const batch = playbackIds.slice(i, i + 50);
      const res = await this.api
        .get("tracks", {
          searchParams: this.withMarket({ ids: batch.join(",") }),
        })
        .json<{ tracks: Array<SpotifyTrack | null> }>();
      for (const tr of res.tracks) {
        if (!tr) continue;
        if (tr.preview_url) {
          out.push({ playbackId: tr.id, playUrl: tr.preview_url });
        }
      }
    }
    return out;
  }

  async personalized(): Promise<Personalized> {
    const [newReleases, popularPlaylists, popularArtists] = await Promise.all([
      this.api
        .get("browse/new-releases", {
          searchParams: this.withMarket({ limit: "20" }),
        })
        .json<{ albums: SpotifyPaging<SpotifySimplifiedAlbum> }>(),
      // featured-playlists is unavailable to apps created after 2024-11; fall back to search.
      this.api
        .get("search", {
          searchParams: this.withMarket({
            q: "top hits",
            type: "playlist",
            limit: "20",
          }),
        })
        .json<{
          playlists: SpotifyPaging<{
            id: string;
            name: string;
            images: SpotifyImage[];
            tracks?: { total?: number };
          }>;
        }>()
        .catch(() => ({
          playlists: { items: [] } as SpotifyPaging<{
            id: string;
            name: string;
            images: SpotifyImage[];
            tracks?: { total?: number };
          }>,
        })),
      this.api
        .get("search", {
          searchParams: this.withMarket({
            q: "year:2024",
            type: "artist",
            limit: "10",
          }),
        })
        .json<{
          artists: SpotifyPaging<{
            id: string;
            name: string;
            images: SpotifyImage[];
            genres?: string[];
          }>;
        }>()
        .catch(() => ({
          artists: { items: [] } as SpotifyPaging<{
            id: string;
            name: string;
            images: SpotifyImage[];
            genres?: string[];
          }>,
        })),
    ]);

    const albums = (newReleases.albums.items ?? []).map(
      (al): AlbumSnapshot => ({
        providerId: SPOTIFY_PROVIDER_ID,
        id: al.id,
        name: al.name,
        images: toImages(al.images),
        totalTracks: al.total_tracks ?? 0,
        artists: (al.artists ?? []).map(
          (a): ArtistLink => ({ providerId: SPOTIFY_PROVIDER_ID, id: a.id, name: a.name }),
        ),
      }),
    );

    const playlists = (popularPlaylists.playlists.items ?? []).map(
      (pl): PlaylistSnapshot => ({
        providerId: SPOTIFY_PROVIDER_ID,
        id: pl.id,
        name: pl.name,
        images: toImages(pl.images),
        totalTracks: pl.tracks?.total ?? 0,
      }),
    );

    const artists = (popularArtists.artists.items ?? []).map(
      (ar): ArtistSnapshot => ({
        providerId: SPOTIFY_PROVIDER_ID,
        id: ar.id,
        name: ar.name,
        images: toImages(ar.images),
        genres: ar.genres ?? [],
      }),
    );

    return {
      playlists: playlists.slice(0, 10),
      albums: albums.slice(0, 10),
      artists: artists.slice(0, 10),
      tracks: [],
    };
  }
}
