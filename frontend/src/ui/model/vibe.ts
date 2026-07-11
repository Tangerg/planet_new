import type { Image } from "@contexts/catalog";
import type { TrackSnapshot } from "@contexts/catalog";
import { TrackKey, type ProviderId, type TrackKeyValue } from "@contexts/contracts";

/** Display shape for a track, shared by mock and real data alike. */
export type VibeTrack = {
  /** Source namespace for the provider-local `id`. Required before a view-only
   * track can cross back into the domain/playback boundary. */
  providerId?: ProviderId;
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
  playbackId?: string;
  musicVideoId?: string;
  /** Mix/edit label, e.g. "live", "acoustic" ("studio" is treated as none). */
  version?: string;
  /** Full playback needs a paid subscription (projected from the domain fact). */
  requiresSubscription?: boolean;
  /** Audio-quality badge, e.g. "SQ" / "HQ". */
  quality?: string;
  credits?: { music?: string; producer?: string };
  /** Chart-only: explicit rank + week-over-week delta (mock charts). */
  _rank?: number;
  _delta?: number;
  /** The domain track this view was projected from. Carried so a "play" gesture
   *  can hand the kernel the full entity without re-fetching (the queue stores
   *  domain tracks and re-projects them for Now Playing). It may be absent on
   *  hand-built view tracks; those must carry `providerId` before crossing back
   *  into the domain. Boundary rule: only the track adapter writes `source`
   *  (hence `readonly`), only `toTrack()` reads it back. */
  readonly source?: TrackSnapshot;
};

/** Source-qualified identity at the presentation boundary. View-only
 * placeholders deliberately have no key and cannot participate in identity
 * comparisons, persistence, likes or playback commands. */
export function vibeTrackKey(
  track: Pick<VibeTrack, "providerId" | "id"> | null | undefined,
): TrackKeyValue | undefined {
  return track?.providerId && track.id ? TrackKey.of(track.providerId, track.id) : undefined;
}

export function sameVibeTrack(
  left: Pick<VibeTrack, "providerId" | "id"> | null | undefined,
  right: Pick<VibeTrack, "providerId" | "id"> | null | undefined,
): boolean {
  const leftKey = vibeTrackKey(left);
  return leftKey !== undefined && leftKey === vibeTrackKey(right);
}

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
  /** Whether opening this collection should fetch full detail from the provider.
   *  Default (undefined) = fetch; explicit `false` = tracks already loaded
   *  (mock / synthetic collections like Daily Mix, Liked Songs). */
  fetchDetail?: boolean;
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
  playbackResolved?: boolean;
  requiresSubscription?: boolean;
  available?: boolean;
  quality?: number;
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
  fetchDetail?: boolean;
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

/** Provider search results projected to Vibe display shapes. */
export type SearchResults = {
  tracks: VibeTrack[];
  artists: VibeArtist[];
  albums: VibeCollection[];
  playlists: VibeCollection[];
};

/** Stable string id -> non-negative int, seeding a fixed gradient per entity. */
export function seedOf(id: string | number | undefined): number {
  const s = String(id ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
