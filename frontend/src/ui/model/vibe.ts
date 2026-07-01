import type { Image } from "@domain/model/image";
import type { MusicVideo } from "@domain/model/music-video";
import type { Track } from "@domain/model/track";

/** Display shape for a track, shared by mock and real data alike. */
export type VibeTrack = {
  id: string;
  index?: number;
  title: string;
  name: string;
  /** Credited artists as one display string (", "-joined). */
  artist: string;
  /** Primary artist id (lead) — the single-link fallback target. */
  artistId?: string;
  /** Every credited artist as {id,name}, so a group credit can navigate to ANY
   *  member, not just the lead. Entries without an id render as plain text. */
  artists?: ArtistRef[];
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
  musicVideoId?: string;
  available?: boolean;
  /** Mix/edit label, e.g. "live", "acoustic" ("studio" is treated as none). */
  version?: string;
  vipOnly?: boolean;
  /** Audio-quality badge, e.g. "SQ" / "HQ". */
  quality?: string;
  credits?: { music?: string; producer?: string };
  /** Chart-only: explicit rank + week-over-week delta (mock charts). */
  _rank?: number;
  _delta?: number;
  /** Original partial domain track; used when handing playback back to the kernel. */
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
  /** The artist's albums (filled after artistDetail resolves). */
  albums?: VibeCollection[];
  /** Related artists (filled after artistDetail resolves). */
  similar?: VibeArtist[];
};

/** Display shape for official music videos. */
export type VibeMusicVideo = {
  id: string;
  title: string;
  name: string;
  artist: string;
  artistId?: string;
  artists?: ArtistRef[];
  image?: string;
  images?: Image[];
  coverSeed: number;
  duration: string;
  durSec: number;
  description?: string;
  publishDate?: string;
  playCount?: number;
  commentCount?: number;
  likedCount?: number;
  shareCount?: number;
  playUrl?: string;
  quality?: number;
  _real?: Partial<MusicVideo>;
};

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

export type ArtistRef = { id: string; name: string };

export type ArtistTarget = ArtistRef & Partial<VibeArtist>;

export type VibeComment = {
  id: string;
  name: string;
  avatar?: Image[];
  content: string;
  likedCount: number;
  /** Pre-formatted relative time (e.g. "3d ago"). */
  timeLabel: string;
};

export type ScreenData = {
  playlists: VibeCollection[];
  albums: VibeCollection[];
  artists: VibeArtist[];
  allTracks: VibeTrack[];
};

/** Stable string id -> non-negative int, seeding a fixed gradient per entity. */
export function seedOf(id: string | number | undefined): number {
  const s = String(id ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
