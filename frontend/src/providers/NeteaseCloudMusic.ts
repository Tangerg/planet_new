import ky, { KyInstance } from "ky";

import { Provider } from "./provider";
import {
  ProviderCapability,
  type Account,
  type AuthProvider,
  type CredentialStore,
  type LoginFlow,
  type LoginStatus,
  type UserLibrary,
} from "@domain";
import { Playlist } from "@domain/model/playlist";
import { Track, TrackPlayUrl } from "@domain/model/track";
import { Artist } from "@domain/model/artist";
import { Lyric, parseLyrics, mergeTranslations } from "@domain/model/lyric";
import { Album } from "@domain/model/album";
import { Chart } from "@domain/model/chart";
import { Comment } from "@domain/model/comment";
import { Personalized } from "@domain/model/personalized";
import { SearchResult } from "@domain/model/search";
import {
  mapNcmAlbum,
  mapNcmAlbumNewest,
  mapNcmChart,
  mapNcmComment,
  mapNcmFeaturedArtist,
  mapNcmPlaylist,
  mapNcmPlaylistStub,
  mapNcmTrack,
  coverSet,
  toHttps,
} from "./mappers/ncm";

export type Options = {
  host: string;
  /** Persists the session cookie; injected so login survives restarts. */
  credentials?: CredentialStore;
};

export class NeteaseCloudMusic extends Provider implements AuthProvider, UserLibrary {
  public static readonly NAME = "NeteaseCloudMusic";
  private static readonly CAPABILITIES: ReadonlySet<ProviderCapability> =
    new Set<ProviderCapability>([
      "playlistDetail",
      "albumDetail",
      "artistDetail",
      "lyric",
      "personalized",
      "search",
      "toplist",
      "comments",
      "auth",
      "userLibrary",
      "fullPlayback",
    ]);

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
    const res = await this.http
      .get("playlist/detail", {
        searchParams: { id },
      })
      .json<{ playlist: any }>();
    return mapNcmPlaylist(res.playlist);
  }

  async lyric(id: string): Promise<Lyric[]> {
    // NCM returns the original (lrc) plus a timed translation (tlyric); merge
    // them by timestamp so the UI can show both lines.
    const res = await this.http
      .get("lyric", {
        searchParams: { id },
      })
      .json<{ lrc?: { lyric?: string }; tlyric?: { lyric?: string } }>();
    const main = parseLyrics(res.lrc?.lyric ?? "");
    const translated = parseLyrics(res.tlyric?.lyric ?? "");
    return mergeTranslations(main, translated);
  }

  async albumDetail(id: string): Promise<Album> {
    const res = await this.http
      .get("album", {
        searchParams: { id },
      })
      .json<{ album: any; songs: any[] }>();
    return mapNcmAlbum(res.album, res.songs ?? []);
  }

  async artistDetail(id: string): Promise<Artist> {
    type ArtistInfoRes = { artist: any; hotSongs: any[] };
    type ArtistDescRes = {
      briefDesc?: string;
      introduction?: { ti?: string; txt?: string }[];
    };
    type ArtistAlbumRes = { hotAlbums?: any[] };
    type SimilarRes = { artists?: any[] };
    // /artists returns artist info + hotSongs in one call; bio comes from
    // /artist/desc; the discography from /artist/album; related acts from
    // /simi/artist. All in parallel.
    const [info, desc, albumRes, simiRes] = await Promise.all([
      this.http
        .get("artists", { searchParams: { id } })
        .json<ArtistInfoRes>()
        .catch(() => ({ artist: {}, hotSongs: [] }) as ArtistInfoRes),
      this.http
        .get("artist/desc", { searchParams: { id } })
        .json<ArtistDescRes>()
        .catch(() => ({}) as ArtistDescRes),
      this.http
        .get("artist/album", { searchParams: { id, limit: 50 } })
        .json<ArtistAlbumRes>()
        .catch(() => ({ hotAlbums: [] }) as ArtistAlbumRes),
      this.http
        .get("simi/artist", { searchParams: { id } })
        .json<SimilarRes>()
        .catch(() => ({ artists: [] }) as SimilarRes),
    ]);

    const artist = info.artist ?? {};
    const topTracks = (info.hotSongs ?? [])
      .slice(0, 10)
      .map((s, i) => mapNcmTrack(s, { index: i + 1 }));
    const albums = (albumRes.hotAlbums ?? []).map(mapNcmAlbumNewest);
    const similar = (simiRes.artists ?? []).map(mapNcmFeaturedArtist);
    const description = desc.briefDesc || desc.introduction?.[0]?.txt || "";
    return {
      id: artist.id?.toString() ?? id,
      name: artist.name ?? "",
      // Use the canonical square avatar (img1v1) — the SAME asset the artist
      // cards (featured / search) use — so opening an artist morphs the round
      // card straight into the round hero with no image swap. NCM's `cover` is
      // just the portrait (not a wide banner), so there's no banner to set.
      images: coverSet(artist.img1v1Url ?? artist.picUrl),
      alias: artist.alias ?? [],
      description,
      topTracks,
      albums,
      similar,
    };
  }

  async playUrls(ids: string[]): Promise<TrackPlayUrl[]> {
    if (ids.length === 0) return [];
    const res = await this.http
      .get("song/url/v1", {
        searchParams: {
          level: "exhigh",
          id: ids.join(","),
        },
      })
      .json<{ data: Array<{ id: number | string; url: string | null }> }>();
    return res.data
      .filter((tr) => !!tr.url)
      .map(
        (tr): TrackPlayUrl => ({
          id: tr.id.toString(),
          // NCM returns http stream URLs; the secure-context webview blocks
          // http <audio src> as mixed content, so upgrade to https (the CDN
          // serves both — verified 206 audio/mpeg).
          playUrl: toHttps(tr.url as string),
        }),
      );
  }

  private async personalizedPlaylist(): Promise<Partial<Playlist>[]> {
    const res = await this.http.get("personalized").json<{ result: any[] }>();
    return res.result.map(mapNcmPlaylistStub);
  }

  private async personalizedTracks(): Promise<Partial<Track>[]> {
    const res = await this.http
      .get("personalized/newsong")
      .json<{ result: Array<{ song: any }> }>();
    return res.result.map((item) => mapNcmTrack(item.song));
  }

  private async personalizedAlbums(): Promise<Partial<Album>[]> {
    const res = await this.http.get("album/newest").json<{ albums: any[] }>();
    return res.albums.map(mapNcmAlbumNewest);
  }

  private async personalizedArtists(): Promise<Partial<Artist>[]> {
    const res = await this.http.get("top/artists").json<{ artists: any[] }>();
    return res.artists.map(mapNcmFeaturedArtist);
  }

  async personalized(): Promise<Personalized> {
    const [playlists, albums, artists, tracks] = await Promise.all([
      this.personalizedPlaylist(),
      this.personalizedAlbums(),
      this.personalizedArtists(),
      this.personalizedTracks(),
    ]);
    return {
      playlists: playlists.slice(0, 10),
      albums: albums.slice(0, 10),
      artists: artists.slice(0, 10),
      tracks: tracks.slice(0, 10),
    };
  }

  async search(query: string): Promise<SearchResult> {
    const q = query.trim();
    if (!q) return SearchResult.empty();
    // /cloudsearch returns full song nodes (al/ar/dt); one call per type, in
    // parallel. type 1=songs · 100=artists · 10=albums · 1000=playlists.
    const byType = (type: number) =>
      this.http
        .get("cloudsearch", { searchParams: { keywords: q, type, limit: 30 } })
        .json<{ result?: any }>()
        .catch(() => ({ result: {} }) as { result?: any });
    const [songs, artists, albums, playlists] = await Promise.all([
      byType(1),
      byType(100),
      byType(10),
      byType(1000),
    ]);
    return {
      tracks: (songs.result?.songs ?? []).map((s: any, i: number) =>
        mapNcmTrack(s, { index: i + 1 }),
      ),
      artists: (artists.result?.artists ?? []).map(mapNcmFeaturedArtist),
      albums: (albums.result?.albums ?? []).map(mapNcmAlbumNewest),
      playlists: (playlists.result?.playlists ?? []).map(mapNcmPlaylistStub),
    };
  }

  async toplists(): Promise<Chart[]> {
    const res = await this.http
      .get("toplist")
      .json<{ list?: any[] }>()
      .catch(() => ({ list: [] }) as { list?: any[] });
    return (res.list ?? []).map(mapNcmChart).filter((c) => c.id && c.title);
  }

  async toplistDetail(id: string): Promise<Playlist> {
    // A chart is a playlist on NCM, so its detail goes through the same endpoint.
    return this.playlistDetail(id);
  }

  async comments(trackId: string): Promise<Comment[]> {
    // hotComments (热评) first, then recent; dedupe by id and cap.
    const res = await this.http
      .get("comment/music", { searchParams: { id: trackId, limit: 30 } })
      .json<{ hotComments?: any[]; comments?: any[] }>()
      .catch(() => ({}) as { hotComments?: any[]; comments?: any[] });
    const seen = new Set<string>();
    const out: Comment[] = [];
    for (const raw of [...(res.hotComments ?? []), ...(res.comments ?? [])]) {
      const c = mapNcmComment(raw);
      if (!c.id || seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
    }
    return out.slice(0, 30);
  }

  // ── Auth (QR login: scan with the NCM mobile app) ──────────────────────────

  async beginLogin(): Promise<LoginFlow> {
    const keyRes = await this.http
      .get("login/qr/key", { searchParams: { timestamp: Date.now() } })
      .json<{ data?: { unikey?: string } }>();
    const key = keyRes.data?.unikey ?? "";
    const createRes = await this.http
      .get("login/qr/create", { searchParams: { key, qrimg: true, timestamp: Date.now() } })
      .json<{ data?: { qrimg?: string } }>();

    return {
      kind: "qr",
      image: createRes.data?.qrimg ?? "",
      poll: async (): Promise<LoginStatus> => {
        // 800 expired · 801 waiting · 802 scanned (awaiting confirm) · 803 success.
        const res = await this.http
          .get("login/qr/check", { searchParams: { key, timestamp: Date.now() } })
          .json<{ code?: number; cookie?: string }>()
          .catch(() => ({}) as { code?: number; cookie?: string });
        if (res.code === 803) {
          if (res.cookie) this.credentials?.set(this.name, { token: res.cookie });
          return { state: "authorized" };
        }
        if (res.code === 802) return { state: "scanned" };
        if (res.code === 800) return { state: "expired" };
        return { state: "pending" };
      },
    };
  }

  async account(): Promise<Account> {
    const res = await this.http
      .get("user/account", { searchParams: { timestamp: Date.now() } })
      .json<{ profile?: any; account?: any }>();
    const profile = res.profile ?? {};
    const id = (profile.userId ?? "").toString();
    // Opportunistically cache the uid so likelist / playlists / record don't pay
    // for a second /user/account round-trip.
    if (id) this.uid = id;
    // Follower / following counts live on /user/detail (needs the uid); fold them
    // in when present, but never fail the whole account read if it's unavailable.
    const detail = id
      ? await this.http
          .get("user/detail", { searchParams: { uid: id, timestamp: Date.now() } })
          .json<{ profile?: any }>()
          .catch(() => ({}) as { profile?: any })
      : {};
    const dp = detail.profile ?? {};
    return {
      id,
      name: profile.nickname ?? "",
      avatar: coverSet(profile.avatarUrl),
      vip: (res.account?.vipType ?? 0) > 0,
      followers: dp.followeds ?? profile.followeds,
      following: dp.follows ?? profile.follows,
    };
  }

  async logout(): Promise<void> {
    await this.http.get("logout", { searchParams: { timestamp: Date.now() } }).catch(() => {});
    this.credentials?.clear(this.name);
    this.uid = undefined;
  }

  // ── User library (requires login) ──────────────────────────────────────────

  /** likelist / user-playlist / record endpoints need the uid; resolve it once
   *  per session. Uses the lightweight /user/account (not the enriched account(),
   *  which also fetches follower counts) so id-only callers stay cheap. */
  private async ensureUid(): Promise<string> {
    if (this.uid) return this.uid;
    const res = await this.http
      .get("user/account", { searchParams: { timestamp: Date.now() } })
      .json<{ profile?: { userId?: number | string } }>();
    this.uid = (res.profile?.userId ?? "").toString();
    return this.uid;
  }

  async likedTrackIds(): Promise<string[]> {
    const uid = await this.ensureUid();
    const res = await this.http
      .get("likelist", { searchParams: { uid, timestamp: Date.now() } })
      .json<{ ids?: Array<number | string> }>()
      .catch(() => ({ ids: [] }) as { ids?: Array<number | string> });
    return (res.ids ?? []).map(String);
  }

  async setLiked(trackId: string, liked: boolean): Promise<void> {
    await this.http.get("like", {
      searchParams: { id: trackId, like: liked, timestamp: Date.now() },
    });
  }

  async userPlaylists(): Promise<Playlist[]> {
    const uid = await this.ensureUid();
    const res = await this.http
      .get("user/playlist", { searchParams: { uid, limit: 50, timestamp: Date.now() } })
      .json<{ playlist?: any[] }>()
      .catch(() => ({ playlist: [] }) as { playlist?: any[] });
    // Stubs (cover/name/count); tracks are fetched when a playlist is opened.
    return (res.playlist ?? []).map((p) => ({ ...mapNcmPlaylistStub(p), tracks: [] }) as Playlist);
  }

  async playRecord(period: "week" | "all"): Promise<Partial<Track>[]> {
    const uid = await this.ensureUid();
    // type 1 = last week's record, 0 = all-time. Each row is { playCount, song }
    // sorted by play count; the full song node lives in `song`.
    const type = period === "week" ? 1 : 0;
    const res = await this.http
      .get("user/record", { searchParams: { uid, type, timestamp: Date.now() } })
      .json<{ weekData?: Array<{ song: any }>; allData?: Array<{ song: any }> }>()
      .catch(() => ({}) as { weekData?: Array<{ song: any }>; allData?: Array<{ song: any }> });
    const rows = period === "week" ? res.weekData : res.allData;
    return (rows ?? []).map((row, i) => mapNcmTrack(row.song, { index: i + 1 }));
  }

  async dailyRecommendations(): Promise<Partial<Track>[]> {
    const res = await this.http
      .get("recommend/songs", { searchParams: { timestamp: Date.now() } })
      .json<{ data?: { dailySongs?: any[] } }>()
      .catch(() => ({ data: {} }) as { data?: { dailySongs?: any[] } });
    return (res.data?.dailySongs ?? []).map((s, i) => mapNcmTrack(s, { index: i + 1 }));
  }
}
