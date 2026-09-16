import type { Image, TrackSnapshot } from "@contexts/catalog";
import { TrackKey, type ProviderId, type TrackKeyValue } from "@contexts/contracts";

import type { MessageKey } from "@/i18n/text";

export type VibeTrack = {
  providerId?: ProviderId;
  id: string;
  index?: number;
  title: string;
  name: string;
  artist: string;
  artistId?: string;
  artists?: ArtistRef[];
  album?: string;
  albumId?: string;
  image?: string;
  images?: Image[];
  coverSeed: number;
  gradient?: string[];
  durSec: number;
  duration: string;
  playUrl?: string;
  playbackId?: string;
  musicVideoId?: string;
  version?: string;
  requiresSubscription?: boolean;
  quality?: string;
  credits?: { music?: string; producer?: string };
  readonly source?: TrackSnapshot;
};

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

export type CollectionKind = "playlist" | "album" | "chart" | "artist";

const COLLECTION_KIND_KEYS = {
  playlist: "common.playlist",
  album: "common.album",
  chart: "common.chart",
  artist: "common.artist",
} as const satisfies Record<CollectionKind, MessageKey>;

export function collectionKindMessageKey(kind: CollectionKind | undefined): MessageKey {
  return COLLECTION_KIND_KEYS[kind ?? "playlist"];
}

export const COLLECTION_VIEW_MODES = ["list", "grid", "flow"] as const;
export type CollectionViewMode = (typeof COLLECTION_VIEW_MODES)[number];

export const LIBRARY_SECTION_TAB_VALUES = ["playlists", "albums", "artists", "songs"] as const;
export type LibrarySectionTab = (typeof LIBRARY_SECTION_TAB_VALUES)[number];

export type VibeCollection = {
  id: string;
  name: string;
  kind: CollectionKind;
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
  sub?: string;
  updatedAt?: string;
  title?: string;
  fetchDetail?: boolean;
};

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
  tracks?: VibeTrack[];
  albums?: VibeCollection[];
  similar?: VibeArtist[];
};

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
  kind?: CollectionKind;
  owner?: string;
  description?: string;
  year?: number;
  tracks?: VibeTrack[];
  fetchDetail?: boolean;
};

export type DetailTarget = OpenTarget & { tracks: VibeTrack[] };

export type ArtistRef = { id: string; name: string };

export type TrackListBindings = {
  onPlay: (track: VibeTrack) => void;
  current?: VibeTrack;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (track: VibeTrack) => void;
  onOpenArtist: (artist: ArtistRef) => void;
};

export type ArtistTarget = ArtistRef & Partial<VibeArtist>;

export type VibeComment = {
  id: string;
  name: string;
  avatar?: Image[];
  content: string;
  likedCount: number;
  postedAt: number;
};

export type ScreenData = {
  playlists: VibeCollection[];
  albums: VibeCollection[];
  artists: VibeArtist[];
  allTracks: VibeTrack[];
};

export type SearchResults = {
  tracks: VibeTrack[];
  artists: VibeArtist[];
  albums: VibeCollection[];
  playlists: VibeCollection[];
};

export function seedOf(id: string | number | undefined): number {
  const s = String(id ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
