/**
 * Presentation projection: domain entities → the typed shapes the vibe screens
 * consume. The screens are a verbatim port of the example and read display
 * fields (title/artist/coverSeed/durSec/...); this layer maps real
 * Track/Playlist/Album/Artist onto them, delegating every domain derivation
 * (artist names, cover URL, duration, year, counts) to the entity companions.
 * What stays here is genuinely presentational: `coverSeed`/`gradient` (the
 * example's generative-gradient fallback) and the "Sonance" owner default.
 *
 * `toTrack` is the reverse adapter: presentation → domain, used when handing
 * playback back to the kernel (PlaybackService expects domain Track[]).
 */
import { Album } from "@domain/model/album";
import { Artist } from "@domain/model/artist";
import { Image } from "@domain/model/image";
import { Playlist } from "@domain/model/playlist";
import { Track } from "@domain/model/track";

// ── Presentation models ─────────────────────────────────────────────

/** Display shape for a track, shared by mock and real data alike. */
export type VibeTrack = {
  id: string;
  index?: number;
  title: string;
  name: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  image?: string;
  /** Size variants (largest-first); <Art> picks the one matching its render box. */
  images?: Image[];
  coverSeed: number;
  gradient?: string[];
  durSec: number;
  duration: string;
  playUrl?: string;
  available?: boolean;
  // ── Editorial display extras (present in mock data; absent on real tracks) ──
  /** Mix/edit label, e.g. "live", "acoustic" ("studio" is treated as none). */
  version?: string;
  vipOnly?: boolean;
  /** Audio-quality badge, e.g. "SQ" / "HQ". */
  quality?: string;
  credits?: { music?: string; producer?: string };
  /** Chart-only: explicit rank + week-over-week delta (mock charts). */
  _rank?: number;
  _delta?: number;
  /** The original partial domain track (may be incomplete in mock data); used when handing playback back to the kernel. */
  _real?: Partial<Track>;
};

/** Display shape for a collection (playlist / album / chart). */
export type VibeCollection = {
  id: string;
  name: string;
  kind: string;
  owner?: string;
  artist?: string;
  artistId?: string;
  coverSeed: number;
  gradient?: string[];
  image?: string;
  images?: Image[];
  description?: string;
  tracks: VibeTrack[];
  trackCount?: number;
  year?: number;
  /** Chart subtitle (e.g. "today"). */
  sub?: string;
  /** Chart update period label. */
  updatedAt?: string;
  /** Chart title alias (some screens read `title` instead of `name`). */
  title?: string;
  /** Detail variant tag — "chart" switches the track list to ranked rows. */
  variant?: string;
  /** Whether the detail should be fetched from the provider (false = mock-only). */
  _real?: boolean;
};

/** Display shape for an artist. */
export type VibeArtist = {
  id: string;
  name: string;
  coverSeed: number;
  gradient?: string[];
  image?: string;
  images?: Image[];
  banner?: string;
  listeners?: number;
  genres?: string[];
  bio?: string;
  /** Top tracks (filled after artistDetail resolves). */
  tracks?: VibeTrack[];
};

/**
 * The minimal cover-bearing shape a card needs to render its art, fly the morph,
 * and feed the right-click menu — the structural supertype of VibeCollection,
 * VibeArtist and VibeTrack. Lets the shared cards/menus type their input without
 * caring which entity it is (and without `any`).
 */
export type CardItem = {
  id: string;
  name: string;
  coverSeed: number;
  gradient?: string[];
  image?: string;
  images?: Image[];
  artistId?: string;
  artist?: string;
};

/**
 * A collection handed to openDetail — a full VibeCollection, or a synthesised /
 * partial summary (Liked Songs, a chart/album before its detail fetch resolves).
 * `OpenTarget` is the loose input; `DetailTarget` (tracks guaranteed) is what the
 * detail screen renders after normalisation.
 */
export type OpenTarget = CardItem & {
  kind?: string;
  owner?: string;
  description?: string;
  year?: number;
  variant?: string;
  tracks?: VibeTrack[];
  _real?: boolean;
};
export type DetailTarget = OpenTarget & { tracks: VibeTrack[] };

/** The minimal artist reference a card/row/bar hands to `openArtist` — just
 *  enough to navigate (id + display name); the screen fetches the rest. */
export type ArtistRef = { id: string; name: string };

/** An artist handed to openArtist — id/name always; the rest fills in on fetch. */
export type ArtistTarget = ArtistRef & Partial<VibeArtist>;

/** The catalog slice every browse screen consumes (home / library / search). */
export type ScreenData = {
  playlists: VibeCollection[];
  albums: VibeCollection[];
  artists: VibeArtist[];
  allTracks: VibeTrack[];
};

// ── Helpers ─────────────────────────────────────────────────────────

/** Stable string id → non-negative int, seeding a fixed gradient per entity. */
export function seedOf(id: string | number | undefined): number {
  const s = String(id ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ── Domain → Presentation ────────────────────────────────────────────

export function toVibeTrack(real: Partial<Track>, i?: number): VibeTrack {
  return {
    id: String(real.id ?? ""),
    index: real.index ?? i,
    title: real.name ?? "",
    name: real.name ?? "",
    artist: Track.artistNames(real),
    artistId: Track.primaryArtist(real)?.id,
    album: real.album?.name,
    albumId: real.album?.id,
    image: Track.coverUrl(real),
    images: real.album?.images,
    coverSeed: seedOf(real.id),
    gradient: undefined,
    durSec: Track.durationSeconds(real),
    duration: Track.durationFormatted(real),
    playUrl: real.playUrl,
    available: true,
    _real: real,
  };
}

export const toVibeTracks = (xs?: Partial<Track>[]) => (xs ?? []).map((t, i) => toVibeTrack(t, i));

export function toVibePlaylist(p: Partial<Playlist>): VibeCollection {
  return {
    id: String(p.id ?? ""),
    name: p.name ?? "",
    kind: "Playlist",
    owner: Playlist.ownerName(p) ?? "Sonance",
    coverSeed: seedOf(p.id),
    gradient: undefined,
    image: Playlist.coverUrl(p),
    images: p.images,
    description: p.description,
    tracks: toVibeTracks(p.tracks),
    trackCount: Playlist.trackCount(p),
  };
}

export function toVibeAlbum(a: Partial<Album>): VibeCollection {
  const artistName = Album.artistNames(a);
  return {
    id: String(a.id ?? ""),
    name: a.name ?? "",
    kind: "Album",
    artist: artistName,
    artistId: Album.primaryArtist(a)?.id,
    owner: artistName || "Sonance",
    coverSeed: seedOf(a.id),
    gradient: undefined,
    image: Album.coverUrl(a),
    images: a.images,
    year: Album.year(a),
    description: artistName,
    tracks: toVibeTracks(a.tracks),
    trackCount: Album.trackCount(a),
  };
}

export function toVibeArtist(a: Partial<Artist>): VibeArtist {
  return {
    id: String(a.id ?? ""),
    name: a.name ?? "",
    coverSeed: seedOf(a.id),
    gradient: undefined,
    image: Artist.coverUrl(a),
    images: a.images,
    banner: a.banner,
    listeners: a.followers,
    genres: a.genres ?? [],
    bio: a.description ?? "",
  };
}

// ── Presentation → Domain (reverse adapter for playback) ─────────────

/**
 * Recover the domain Track from a VibeTrack, for handing playback back to
 * the kernel. Uses `_real` when available (real provider data); otherwise
 * synthesises a minimal Track from the display fields (mock / fallback).
 */
export function toTrack(vt: VibeTrack): Track {
  if (vt._real && vt._real.id) return vt._real as Track;
  return {
    id: vt.id,
    name: vt.name,
    durationMs: vt.durSec * 1000,
    trackNumber: 0,
    discNumber: 1,
    explicit: false,
    artists: vt.artist ? [{ id: vt.artistId || vt.artist, name: vt.artist }] : [],
    album: vt.albumId ? { id: vt.albumId, name: vt.album || "" } : undefined,
    playUrl: vt.playUrl,
  };
}
