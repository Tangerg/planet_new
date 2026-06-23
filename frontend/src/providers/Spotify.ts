import ky, { KyInstance } from "ky";

import Provider from "./provider";
import { ProviderCapability } from "@domain";
import { Playlist } from "@domain/model/playlist";
import { Track, TrackPlayUrl } from "@domain/model/track";
import { Artist } from "@domain/model/artist";
import { Album } from "@domain/model/album";
import { Image } from "@domain/model/image";
import { Lyric } from "@domain/model/lyric";
import { Personalized } from "@domain/model/personalized";

/**
 * Spotify Web API provider.
 *
 * Limitations (vs NeteaseCloudMusic):
 *   - No full playback URL: each track has at most a 30s `preview_url`, and many
 *     are null. Full playback needs Spotify Premium + the Web Playback SDK,
 *     which this provider does not implement.
 *   - No lyrics: the Web API has no lyric endpoint, so `lyric()` returns [].
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
};

type SpotifyImage = {
  url: string;
  height: number | null;
  width: number | null;
};
type SpotifySimplifiedArtist = { id: string; name: string };
type SpotifySimplifiedAlbum = {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date?: string;
  artists?: SpotifySimplifiedArtist[];
  total_tracks?: number;
};
type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  preview_url: string | null;
  explicit?: boolean;
  track_number?: number;
  artists: SpotifySimplifiedArtist[];
  album?: SpotifySimplifiedAlbum;
};
type SpotifyPaging<T> = {
  items: T[];
  total?: number;
  limit?: number;
  offset?: number;
};

// Spotify returns images largest-first; map straight to domain Image[] (null -> undefined).
const toImages = (images: SpotifyImage[] | undefined): Image[] =>
  (images ?? []).map(
    (im): Image => ({
      url: im.url,
      width: im.width ?? undefined,
      height: im.height ?? undefined,
    }),
  );

export class Spotify extends Provider {
  public static readonly NAME = "Spotify";
  private static readonly CAPABILITIES: ReadonlySet<ProviderCapability> =
    new Set<ProviderCapability>([
      "playlistDetail",
      "albumDetail",
      "artistDetail",
      "personalized",
      "previewPlayback",
      // No lyric (Web API has none); no fullPlayback (only a 30s preview_url).
    ]);

  private readonly opts: Required<Omit<SpotifyOptions, "market">> & Pick<SpotifyOptions, "market">;
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
    this.accounts = ky.create({ prefix: this.opts.accountsHost });
    this.api = ky.create({
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

  get capabilities(): ReadonlySet<ProviderCapability> {
    return Spotify.CAPABILITIES;
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

  private toTrack = (
    t: SpotifyTrack,
    fallbackAlbum?: SpotifySimplifiedAlbum,
    index?: number,
  ): Partial<Track> => {
    const album = t.album ?? fallbackAlbum;
    return {
      index,
      id: t.id,
      name: t.name,
      durationMs: t.duration_ms,
      explicit: t.explicit,
      trackNumber: t.track_number,
      artists: t.artists.map((a): Partial<Artist> => ({ id: a.id, name: a.name })),
      album: album
        ? {
            id: album.id,
            name: album.name,
            images: toImages(album.images),
          }
        : undefined,
      previewUrl: t.preview_url ?? undefined,
      playUrl: t.preview_url ?? undefined,
    };
  };

  async playlistDetail(id: string): Promise<Playlist> {
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

    const tracks = items.map((t, i) => this.toTrack(t, undefined, i + 1));

    return {
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

  async albumDetail(id: string): Promise<Album> {
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
    const tracks = (res.tracks.items ?? []).map((t, i) => this.toTrack(t, albumStub, i + 1));

    return {
      id: res.id,
      name: res.name,
      alias: [],
      images: toImages(res.images),
      totalTracks: res.total_tracks,
      releaseDate: res.release_date,
      tracks,
      artists: res.artists.map((a): Partial<Artist> => ({ id: a.id, name: a.name })),
    };
  }

  async artistDetail(id: string): Promise<Artist> {
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
      this.api
        .get(`artists/${id}`)
        .json<ArtistInfo>()
        .catch(
          () =>
            ({
              id,
              name: "",
              images: [],
            }) as ArtistInfo,
        ),
      this.api
        .get(`artists/${id}/top-tracks`, {
          searchParams: this.withMarket({}),
        })
        .json<TopTracksRes>()
        .catch(() => ({ tracks: [] }) as TopTracksRes),
    ]);

    const topTracks = (top.tracks ?? [])
      .slice(0, 10)
      .map((t, i) => this.toTrack(t, undefined, i + 1));

    return {
      id: info.id,
      name: info.name,
      images: toImages(info.images),
      banner: info.images?.[0]?.url,
      genres: info.genres ?? [],
      followers: info.followers?.total,
      topTracks,
    };
  }

  async playUrls(ids: string[]): Promise<TrackPlayUrl[]> {
    if (ids.length === 0) return [];
    const out: TrackPlayUrl[] = [];
    // /tracks accepts at most 50 ids per call.
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      const res = await this.api
        .get("tracks", {
          searchParams: this.withMarket({ ids: batch.join(",") }),
        })
        .json<{ tracks: Array<SpotifyTrack | null> }>();
      for (const tr of res.tracks) {
        if (!tr) continue;
        if (tr.preview_url) {
          out.push({ id: tr.id, playUrl: tr.preview_url });
        }
      }
    }
    return out;
  }

  async lyric(_id: string): Promise<Lyric[]> {
    // Spotify Web API provides no lyrics.
    return [];
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
      (al): Partial<Album> => ({
        id: al.id,
        name: al.name,
        images: toImages(al.images),
        totalTracks: al.total_tracks ?? 0,
        artists: (al.artists ?? []).map((a): Partial<Artist> => ({ id: a.id, name: a.name })),
      }),
    );

    const playlists = (popularPlaylists.playlists.items ?? []).map(
      (pl): Partial<Playlist> => ({
        id: pl.id,
        name: pl.name,
        images: toImages(pl.images),
        totalTracks: pl.tracks?.total ?? 0,
      }),
    );

    const artists = (popularArtists.artists.items ?? []).map(
      (ar): Partial<Artist> => ({
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

export default Spotify;
