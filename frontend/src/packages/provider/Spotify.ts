import ky, { KyInstance } from "ky";

import Provider from "./provider";
import { ProviderCapability } from "./types";
import { Playlist } from "../model/playlist";
import { Track, TrackPlayUrl } from "../model/track";
import { Artist } from "../model/artist";
import { Album } from "../model/album";
import { Lyric } from "../model/lyric";
import { Personalized } from "../model/personalized";

/**
 * Spotify Web API provider.
 *
 * 限制（与 NeteaseCloudMusic 比较）：
 *   - 不提供完整播放 URL：每首歌最多有 30 秒 `preview_url`，且不少曲目为 null。
 *     完整播放需要 Spotify Premium + Web Playback SDK，本 provider 不实现。
 *   - 不提供歌词：Web API 没有 lyric 接口，`lyric()` 返回空数组。
 *   - 推荐流通过 Client Credentials：使用 new-releases / search 拼出 playlists+albums+artists；
 *     featured-playlists 对 2024-11 之后新建的应用已不可用，因此不依赖它。
 */

export type SpotifyOptions = {
  clientId: string;
  clientSecret: string;
  /** 默认 https://accounts.spotify.com */
  accountsHost?: string;
  /** 默认 https://api.spotify.com */
  apiHost?: string;
  /** market filter, 例如 "US"/"JP"，可空 */
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
  artists: SpotifySimplifiedArtist[];
  album?: SpotifySimplifiedAlbum;
};
type SpotifyPaging<T> = {
  items: T[];
  total?: number;
  limit?: number;
  offset?: number;
};

const pickImage = (images: SpotifyImage[] | undefined): string => {
  if (!images || images.length === 0) return "";
  // Spotify 返回从大到小排序，挑中间档够用
  return (images[1] ?? images[0]).url;
};

const parseReleaseDate = (date: string | undefined): number => {
  if (!date) return 0;
  const ts = Date.parse(date);
  return Number.isNaN(ts) ? 0 : ts;
};

export class Spotify extends Provider {
  public static readonly NAME = "Spotify";
  private static readonly CAPABILITIES: ReadonlySet<ProviderCapability> =
    new Set<ProviderCapability>([
      "playlistDetail",
      "albumDetail",
      "personalized",
      "previewPlayback",
      // 无 lyric（Web API 不提供）；无 fullPlayback（仅 30s preview_url）
    ]);

  private readonly opts: Required<Omit<SpotifyOptions, "market">> &
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
      // 提前 30s 失效，避免边界请求带过期 token
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
    return this.opts.market
      ? { ...params, market: this.opts.market }
      : params;
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
      duration: t.duration_ms,
      artists: t.artists.map(
        (a): Partial<Artist> => ({ id: a.id, name: a.name }),
      ),
      album: album
        ? {
            id: album.id,
            name: album.name,
            image: pickImage(album.images),
          }
        : undefined,
      playUrl: t.preview_url ?? undefined,
    };
  };

  async playlistDetail(id: string): Promise<Playlist> {
    const res = await this.api
      .get(`playlists/${id}`, { searchParams: this.withMarket({}) })
      .json<{
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
    const durationCount = tracks.reduce(
      (acc, t) => acc + (t.duration ?? 0),
      0,
    );

    return {
      id: res.id,
      name: res.name,
      description: res.description ?? "",
      tags: [],
      image: pickImage(res.images),
      createTime: 0,
      trackCount: res.tracks.total ?? tracks.length,
      durationCount,
      creator: {
        id: res.owner.id,
        nickname: res.owner.display_name ?? res.owner.id,
        image: "",
      },
      tracks,
    };
  }

  async albumDetail(id: string): Promise<Album> {
    const res = await this.api
      .get(`albums/${id}`, { searchParams: this.withMarket({}) })
      .json<{
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
    const tracks = (res.tracks.items ?? []).map((t, i) =>
      this.toTrack(t, albumStub, i + 1),
    );
    const durationCount = tracks.reduce(
      (acc, t) => acc + (t.duration ?? 0),
      0,
    );

    return {
      id: res.id,
      name: res.name,
      alias: [],
      image: pickImage(res.images),
      trackCount: res.total_tracks,
      publishTime: parseReleaseDate(res.release_date),
      durationCount,
      tracks,
      artist: res.artists[0]
        ? {
            id: res.artists[0].id,
            name: res.artists[0].name,
          }
        : undefined,
      artists: res.artists.map(
        (a): Partial<Artist> => ({ id: a.id, name: a.name }),
      ),
    };
  }

  async playUrls(ids: string[]): Promise<TrackPlayUrl[]> {
    if (ids.length === 0) return [];
    const out: TrackPlayUrl[] = [];
    // /tracks 一次最多 50 个
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
    // Spotify Web API 不提供歌词
    return [];
  }

  async personalized(): Promise<Personalized> {
    const [newReleases, popularPlaylists, popularArtists] = await Promise.all([
      this.api
        .get("browse/new-releases", {
          searchParams: this.withMarket({ limit: "20" }),
        })
        .json<{ albums: SpotifyPaging<SpotifySimplifiedAlbum> }>(),
      // 2024-11 后 featured-playlists 对新应用不可用，用搜索兜底
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
        image: pickImage(al.images),
        trackCount: al.total_tracks ?? 0,
        artist: al.artists?.[0]
          ? { id: al.artists[0].id, name: al.artists[0].name }
          : undefined,
      }),
    );

    const playlists = (popularPlaylists.playlists.items ?? []).map(
      (pl): Partial<Playlist> => ({
        id: pl.id,
        name: pl.name,
        image: pickImage(pl.images),
        trackCount: pl.tracks?.total ?? 0,
      }),
    );

    const artists = (popularArtists.artists.items ?? []).map(
      (ar): Partial<Artist> => ({
        id: ar.id,
        name: ar.name,
        image: pickImage(ar.images),
        alias: ar.genres ?? [],
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
