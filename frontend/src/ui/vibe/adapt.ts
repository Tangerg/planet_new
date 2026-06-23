/**
 * Presentation projection: domain entities → the loose shapes the vibe screens
 * consume. The screens are a verbatim port of the example and read display
 * fields (title/artist/coverSeed/durSec/...); this layer maps real
 * Track/Playlist/Album/Artist onto them, delegating every domain derivation
 * (artist names, cover URL, duration, year, counts) to the entity companions.
 * What stays here is genuinely presentational: `coverSeed`/`gradient` (the
 * example's generative-gradient fallback) and the "Sonance" owner default.
 */
import { Album } from "@domain/model/album";
import { Artist } from "@domain/model/artist";
import { Playlist } from "@domain/model/playlist";
import { Track } from "@domain/model/track";
import { Second } from "@shared/time";

/** Loose entity shape shared by the vibe screens (mock and real data alike). */
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
  coverSeed: number;
  gradient?: string[];
  durSec: number;
  duration: string;
  playUrl?: string;
  available?: boolean;
  /** The original domain track; used when handing playback back to the kernel. */
  _real?: Track;
  [k: string]: any;
};

/** Stable string id → non-negative int, seeding a fixed gradient per entity. */
export function seedOf(id: string | number | undefined): number {
  const s = String(id ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

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
    coverSeed: seedOf(real.id),
    gradient: undefined,
    durSec: Track.durationSeconds(real),
    duration: Track.durationFormatted(real),
    playUrl: real.playUrl,
    available: true,
    _real: real as Track,
  };
}

export const toVibeTracks = (xs?: Partial<Track>[]) => (xs ?? []).map((t, i) => toVibeTrack(t, i));

/** Vibe track → a kernel-playable Track (carrying playUrl). */
export function toRealTrack(v: VibeTrack): Track {
  if (v._real) return { ...v._real, playUrl: v.playUrl ?? v._real.playUrl };
  // Mock tracks have no `_real`; build a minimal Track (kernel uses id/playUrl/name).
  return {
    id: v.id,
    name: v.title ?? v.name,
    durationMs: (v.durSec ?? 0) * Second,
    artists: [],
    playUrl: v.playUrl,
  } as Track;
}

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
  description?: string;
  tracks: VibeTrack[];
  trackCount?: number;
  [k: string]: any;
};

export function toVibePlaylist(p: Partial<Playlist>): VibeCollection {
  return {
    id: String(p.id ?? ""),
    name: p.name ?? "",
    kind: "Playlist",
    owner: Playlist.ownerName(p) ?? "Sonance",
    coverSeed: seedOf(p.id),
    gradient: undefined,
    image: Playlist.coverUrl(p),
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
    year: Album.year(a),
    description: artistName,
    tracks: toVibeTracks(a.tracks),
    trackCount: Album.trackCount(a),
  };
}

export type VibeArtist = {
  id: string;
  name: string;
  coverSeed: number;
  gradient?: string[];
  image?: string;
  banner?: string;
  listeners?: number;
  genres?: string[];
  bio?: string;
  [k: string]: any;
};

export function toVibeArtist(a: Partial<Artist>): VibeArtist {
  return {
    id: String(a.id ?? ""),
    name: a.name ?? "",
    coverSeed: seedOf(a.id),
    gradient: undefined,
    image: Artist.coverUrl(a),
    banner: a.banner,
    listeners: a.followers,
    genres: a.genres ?? [],
    bio: a.description ?? "",
  };
}
