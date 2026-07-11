import type { TrackSnapshot } from "./track";
import { type Image, pickImageUrl } from "./image";
import type { User } from "./user";
import type { ProviderId } from "./provider-id";

/**
 * Playlist, aligned with the Spotify Playlist object (camelCase).
 * `tracks` is a flat array — Spotify's paging wrapper is unwrapped at the mapper.
 */
export type Playlist = {
  /** Stable source identity; `id` below is local to this provider. */
  providerId: ProviderId;
  id: string;
  name: string;
  description?: string;
  images: Image[];
  owner?: Partial<User>;
  totalTracks?: number;
  tracks: TrackSnapshot[];
};

export type PlaylistSummary = Omit<Playlist, "tracks">;

export type PlaylistSnapshot = PlaylistSummary & Partial<Pick<Playlist, "tracks">>;

export type PlaylistDetailSnapshot = PlaylistSummary & {
  tracks: TrackSnapshot[];
};

/** Playlist behavior; see `Track` for the companion-object rationale. */
export const Playlist = {
  empty(providerId: ProviderId, id = "", name = ""): Playlist {
    return { providerId, id, name, images: [], tracks: [], totalTracks: 0 };
  },

  ownerName(p: Partial<Playlist>): string | undefined {
    return p.owner?.displayName;
  },

  trackCount(p: Partial<Playlist>): number {
    return p.totalTracks ?? p.tracks?.length ?? 0;
  },

  coverUrl(p: Partial<Playlist>, prefer: "large" | "small" = "large"): string {
    return pickImageUrl(p.images, prefer);
  },
};
